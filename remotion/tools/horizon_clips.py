"""Cuts the NASA SVS sources for Short #5 into vertical 1080x1920 30fps clips
(exact source range + speed), muted. Sources (public domain, NASA Goddard /
J. Schnittman, B. Powell): https://svs.gsfc.nasa.gov/14576 and /13326.
Only clips whose output file is missing are rebuilt.
Usage: python3 tools/horizon_clips.py <dir with the downloaded mp4s> public/horizon/clips
"""
import subprocess, sys, os

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
PLUNGE = 'crop=1152:2048:1472:0,scale=1080:1920'          # 4096x2048 rectilinear, hole centred
ZOOM = 'crop=810:1440:1515:0,scale=1080:1920'             # 3840x2160, upper part (the sky)
DISK = 'scale=2100:2100,crop=1080:1920'  # 3840x3840 square, sides cropped

# name: file, source start, source end, output length (s), filter
CLIPS = {
    'disk_hook': ('Black_Hole_Accretion_Disk_Sim_4k.mp4', 0.0, 8.3, 8.3, DISK),
    'disk_face': ('Black_Hole_Accretion_Disk_Sim_4k.mp4', 10.5, 13.3, 2.8, DISK),
    'plunge_in': ('14576_BH_Plunge_Rectilinear_4096x2048_60.mp4', 0.0, 21.0, 12.15, PLUNGE),
    'plunge_cross': ('14576_BH_Plunge_Rectilinear_4096x2048_60.mp4', 32.0, 48.0, 15.9, PLUNGE),
    'inside_sky': ('14576_BH_Plunge_Zoom2b_4k60.mp4', 33.0, 40.4, 8.3, ZOOM),
    'flyby_ring': ('14576_BH_FlyBy_Rectilinear_4096x2048_60.mp4', 26.0, 33.0, 5.0, PLUNGE),
    'disk_end': ('Black_Hole_Accretion_Disk_Sim_4k.mp4', 24.0, 31.7, 7.7, DISK),
}
for name, (f, a, b, length, vf) in CLIPS.items():
    if os.path.exists(f'{out}/{name}.mp4'):
        continue
    speed = (b - a) / length
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(a), '-t', str(b - a), '-i', f'{src}/{f}', '-an',
                    '-vf', f'setpts=PTS/{speed},fps=30,{vf},format=yuv420p', '-c:v', 'libx264', '-crf', '16', '-preset', 'medium',
                    f'{out}/{name}.mp4'], check=True)
    print(name, f'{speed:.2f}x')
