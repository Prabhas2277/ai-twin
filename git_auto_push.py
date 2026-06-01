import os
import subprocess
import time
from datetime import datetime

def run_git_cmd(args):
    try:
        res = subprocess.run(
            args, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE, 
            text=True, 
            check=True
        )
        return res.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"[{datetime.now()}] Git command failed: {' '.join(args)}")
        print(f"Exit code: {e.returncode}")
        print(f"Stdout: {e.stdout}")
        print(f"Stderr: {e.stderr}")
        return None

def check_and_push():
    # Check if there are changes
    status = run_git_cmd(["git", "status", "--porcelain"])
    if status is None:
        return
    
    if not status:
        # No changes
        return
        
    print(f"\n[{datetime.now()}] Detected modifications:\n{status}")
    print("Staging changes...")
    if run_git_cmd(["git", "add", "."]) is None:
        return
        
    commit_msg = f"Auto-update: application files modified at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    print(f"Committing changes: '{commit_msg}'...")
    if run_git_cmd(["git", "commit", "-m", commit_msg]) is None:
        return
        
    print("Pushing to GitHub remote repository...")
    # Using git push directly. If authentication fails, it will print error.
    if run_git_cmd(["git", "push", "origin", "main"]) is not None:
        print(f"[{datetime.now()}] Successfully pushed updates to GitHub!")

def main():
    print(f"[{datetime.now()}] Initializing Git Auto-Push Daemon (polling every 60s)...")
    print("Ensure you have authenticated with your remote origin first.")
    
    try:
        while True:
            check_and_push()
            time.sleep(60)
    except KeyboardInterrupt:
        print("\nAuto-push daemon stopped.")

if __name__ == "__main__":
    main()
