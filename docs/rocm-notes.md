# OmniVoice on an AMD GPU (ROCm): test notes, 2026-10-27 and 2026-10-28

Result: **did not work on the first AMD GPU tested (Radeon 780M); on a second (Radeon 890M) it worked but no faster than the CPU
lane (see "Second test" below).** No `rocm` compose profile was added. AMD readers: use a CPU lane (the recommended one is
`chatterbox-cpu`, docker/chatterbox; `cpu-clone` is OmniVoice on CPU) or a rented NVIDIA GPU (README, "Voice lanes").

## Test machine (VERIFIED from commands, 2026-10-27)
- GPU: AMD Radeon 780M Graphics, the integrated GPU of a Ryzen 7 7840U (PCI 1002:15bf, LLVM target `gfx1103`, 12 compute units).
  `amd-smi`: 2048 MB dedicated VRAM (1.28 GB already used by the desktop), 81000 MB GTT (shared system memory). GPU idle (1 %).
- Kernel driver: in-tree `amdgpu`, Linux 6.18 LTS, linux-firmware 20261019. Host ROCm userspace 10.0.0 (not used: the
  container brings its own ROCm libraries inside the PyTorch wheel). Docker 29.8.2, Compose 5.1.3, legacy builder (no buildx).

## What was read (2026-10-27)
- pytorch.org/get-started: stable PyTorch 2.14.1, Linux ROCm command `pip3 install torch torchvision --index-url
  https://download.pytorch.org/whl/rocm7.14`. That index has NO torchaudio wheel (OmniVoice needs torchaudio), and torchaudio's
  newest release is 2.11.0. So the test used `torch==2.11.0+rocm7.2` and `torchaudio==2.11.0+rocm7.2` (index `whl/rocm7.2`),
  the same torch version as the cpu-clone image.
- OmniVoice README (k2-fsa/OmniVoice): documents CUDA, Apple MPS and Intel XPU; it says nothing about ROCm or AMD.
- AMD's ROCm Linux system requirements page (production docs, ROCm 7.14.0): supported Radeon targets are gfx1030, gfx1100,
  gfx1101, gfx1200, gfx1201 (RX 7700 to 7900, RX 9060/9070, Radeon PRO W6800/W7700/W7800/W7900, V620/V710, AI PRO R9600D/R9700).
  No APU is listed; gfx1103 is not.
- The torch 2.11.0+rocm7.2 wheel's own `torch.cuda.get_arch_list()`: gfx900, 906, 908, 90a, 942, 950, 1030, 1100, 1101, 1102,
  1150, 1151, 1200, 1201. No gfx1103.

## What happened (VERIFIED)
Image: `python:3.12-slim` + the wheels above + `omnivoice==0.1.5` and the cpu-clone pins, server.py from docker/cpu-clone with
`device_map="cuda:0"`, `dtype=torch.float16`. Built in 6.5 min; **23.5 GB on disk** (7 GB content), against 2.5 GB for cpu-clone.
Run flags (AMD's documented set): `--device=/dev/kfd --device=/dev/dri --group-add video --group-add <render gid>
--security-opt seccomp=unconfined --ipc=host`.

1. `torch.cuda.is_available()` is `True` and names the 780M (ROCm torch does present itself as `cuda`), but the first GPU
   operation (a 512x512 matmul) crashes Python with exit code 139; kernel log: `general protection fault ... in libamdhip64.so`.
2. With `HSA_OVERRIDE_GFX_VERSION=11.0.0` (the usual community workaround, makes the GPU pose as gfx1100) the matmul and an
   fp16 matmul succeed. The model loads (about 2.2 GB of GTT) and `/health` answers in 55 s, first start included.
3. The first speech request then hangs the GPU. Container log: MIOpen `GemmFwdRest` workspace warnings, then
   `HW Exception by GPU node-1 ... reason :GPU Hang`, container exit 139. Kernel log: `MES failed to respond to msg=REMOVE_QUEUE`,
   `MES might be in unrecoverable state, issue a GPU reset`, `MODE2 reset`, `GPU reset succeeded`, `device wedged, but recovered
   through reset`. The reset also restarted the desktop's display server on that machine, so testing stopped there.

No audio was produced, so there are no timings to compare with the CPU (preset 6.5x, clone 11x slower than real time at 32
steps) or the RTX 3090 (0.3 to 0.6 s per sentence).

## Not tested
- A discrete card on AMD's supported list (RX 7900 XTX / 7800 XT, RX 9070, W7900 ...). INFERENCE: these are the likeliest to work,
  since the wheel ships native kernels for them and no override is needed; still unverified for OmniVoice.
- On the 780M: `torch.backends.cudnn.enabled = False` (skips MIOpen, where the hang started), `HSA_OVERRIDE_GFX_VERSION=11.0.2`,
  float32, PyTorch 2.14.1+rocm7.14 (torchaudio would have to come from elsewhere), AMD's `rocm/pytorch` image, TheRock nightlies.
  Each try risks another GPU reset, so only on a machine where a reset hurts nobody.
- Other APUs (gfx1150/gfx1151 are in the wheel's arch list but not on AMD's support page).

To retry on a supported card: copy docker/cpu-clone, swap the two torch pins for `torch==2.11.0+rocm7.2 torchaudio==2.11.0+rocm7.2`
with `--index-url https://download.pytorch.org/whl/rocm7.2`, change server.py to `device_map="cuda:0", dtype=torch.float16`, and
run with the flags above (find the render group id with `getent group render`).

## Second test: Radeon 890M (Strix, `gfx1150`), 2026-10-28
VERIFIED from commands. Same image recipe as above (`torch==2.11.0+rocm7.2`, server.py with `device_map="cuda:0"`,
`dtype=torch.float16`), same run flags, **no `HSA_OVERRIDE_GFX_VERSION`**: the wheel ships native `gfx1150` kernels.
- 512x512 matmul (fp32 and fp16) succeeded; the model loaded; `/health` answered.
- Five `/v1/audio/speech/clone` requests (reference clip, 32 steps) all returned audio. No GPU hang or reset in the kernel
  log; the container stayed healthy.
- Speed: a 3.9 to 4.4 s sentence took 33 to 51 s (three timed runs: 33, 34 and 51 s), about 8 to 11x slower than real time.
  That is about the CPU lane's 11x (measured on a different CPU), against 0.3 to 0.6 s per sentence on an RTX 3090.
  The log showed MIOpen `GemmFwdRest` workspace warnings; whether they cost speed was not tested.
- Decision: no `rocm` profile. An APU gives no speedup over `cpu-clone`, and the image is 23.5 GB against 2.5 GB.
- Not tested: a discrete card on AMD's support list (still INFERENCE that it is the likeliest to be fast).
