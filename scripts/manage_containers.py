#!/usr/bin/env python3
import os
import sys
import argparse
import subprocess
import importlib.util

# MBTI Dev -- Internal Container Manager v1.4


def load_project_config(project_path):

    config_file = "container_config.py"
    full_path = os.path.join(project_path, config_file)

    if not os.path.exists(full_path):
        print(f"[-] Error: No {config_file} found in {project_path}")
        sys.exit(1)

    print(f"[*] Loading configuration from {full_path}...")

    spec = importlib.util.spec_from_file_location("project_conf", full_path)
    project_conf = importlib.util.module_from_spec(spec)

    try:
        spec.loader.exec_module(project_conf)
    except Exception as e:
        print(f"[-] Failed to load config: {e}")
        sys.exit(1)

    return project_conf


def restart_containers(containers):
    print("[*] Restarting containers...")
    for container in containers:

        print(f"    -> Restarting {container}")
        try:
            subprocess.run(
                ["/usr/bin/docker", "restart", container], check=True)
        except subprocess.CalledProcessError:
            print(f"    [!] Failed to restart {container}")


def main():
    parser = argparse.ArgumentParser(description="Manage Project Containers")
    parser.add_argument("--project-path", required=True,
                        help="Path to project root containing container_config.py")

    args = parser.parse_args()

    config = load_project_config(args.project_path)

    if not hasattr(config, 'CONTAINERS'):
        print("[-] Invalid Config: Missing 'CONTAINERS' list.")
        sys.exit(1)

    restart_containers(config.CONTAINERS)


if __name__ == "__main__":
    main()
