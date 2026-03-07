#!/usr/bin/env python3
"""Stats API server for Nexus dashboard"""

import os
import subprocess
import json
from datetime import datetime, timedelta
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def run_gh(cmd: list, cwd: str = "/data/openclaw/workspace/The-Nexus") -> list:
    """Run gh CLI command and return JSON output"""
    try:
        result = subprocess.run(
            ["gh"] + cmd,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=30
        )
        if result.returncode == 0:
            return json.loads(result.stdout) if result.stdout.strip() else []
    except Exception as e:
        print(f"Error running gh {' '.join(cmd)}: {e}")
    return []


def get_github_stats():
    """Get GitHub stats for last 24 hours"""
    since = (datetime.now() - timedelta(days=1)).isoformat()
    
    stats = {
        "commits": 0,
        "prs_opened": 0,
        "prs_merged": 0,
        "issues": 0,
        "activity": []
    }
    
    repos = ["The-Nexus", "Pryan-Fire", "Chelestra-Sea", "Arianus-Sky", "Abarrach-Stone"]
    
    for repo in repos:
        # Commits
        commits = run_gh(["api", f"repos/The-Nexus-Decoded/{repo}/commits", "--paginate", f"--since={since}"])
        stats["commits"] += len(commits)
        
        # PRs opened
        prs = run_gh(["api", f"repos/The-Nexus-Decoded/{repo}/pulls", "--paginate", f"--createdsince={since}"])
        stats["prs_opened"] += len(prs)
        
        # Issues
        issues = run_gh(["api", f"repos/The-Nexus-Decoded/{repo}/issues", "--paginate", f"--since={since}"])
        stats["issues"] += len([i for i in issues if not i.get("pull_request")])
    
    # Build activity list from recent commits
    for repo in repos[:3]:
        commits = run_gh(["api", f"repos/The-Nexus-Decoded/{repo}/commits", "--paginate", "-L5"])
        for c in commits[:3]:
            stats["activity"].append({
                "repo": repo,
                "action": c.get("commit", {}).get("message", "")[:50],
                "time": c.get("commit", {}).get("author", {}).get("date", "")[:10]
            })
    
    return stats


def get_fleet_status():
    """Get fleet status from local endpoints"""
    import requests
    
    status = {
        "zifnab": "unknown",
        "haplo": "unknown", 
        "hugh": "unknown",
        "rate_guard": "unknown"
    }
    
    # Check gateways
    hosts = {
        "zifnab": "100.103.189.117",
        "haplo": "100.94.203.10",
        "hugh": "100.104.166.53"
    }
    
    for name, ip in hosts.items():
        try:
            r = requests.get(f"http://{ip}:18789/health", timeout=3)
            status[name] = "online" if r.status_code == 200 else "error"
        except:
            status[name] = "offline"
    
    # Rate guard
    try:
        r = requests.get("http://127.0.0.1:8787/health", timeout=2)
        status["rate_guard"] = "online" if r.status_code == 200 else "error"
    except:
        status["rate_guard"] = "offline"
    
    return status


def get_trading_stats():
    """Get trading stats from database/API"""
    # TODO: Connect to actual trading data
    # For now, return placeholder
    return {
        "positions": 0,
        "volume": 0,
        "fees": 0,
        "pnl": 0
    }


def get_killfeed_stats():
    """Get killfeed stats from Discord"""
    import requests
    
    # Note: Would need Discord bot token for real data
    # Placeholder for now
    return {
        "total": 0,
        "killer": 0,
        "alpha": 0,
        "extreme": 0
    }


@app.get("/api/stats/github")
def github_stats():
    return get_github_stats()


@app.get("/api/stats/fleet")
def fleet_stats():
    return get_fleet_status()


@app.get("/api/stats/trading")
def trading_stats():
    return get_trading_stats()


@app.get("/api/stats/killfeed")
def killfeed_stats():
    return get_killfeed_stats()


@app.get("/")
def root():
    from fastapi.responses import FileResponse
    return FileResponse(Path(__file__).parent / "index.html")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
