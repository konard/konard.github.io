#!/usr/bin/env bash
# Collects public GitHub data used by the case study and the website.
# Usage: experiments/collect-github-data.sh [output-dir]
set -euo pipefail
OUT="${1:-docs/case-studies/issue-1/data}"
mkdir -p "$OUT"
FIELDS='[.[] | {name, full_name, fork, description, language, stargazers_count, forks_count, topics, html_url, homepage, created_at, pushed_at, archived}]'
gh api --paginate "users/konard/repos?type=owner&per_page=100" --jq "$FIELDS" | node -e '
let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const all=s.trim().split("\n").flatMap(l=>JSON.parse(l));process.stdout.write(JSON.stringify(all,null,1)+"\n")})' > "$OUT/repos-konard.json"
for org in linksplatform deep-foundation link-foundation link-assistant; do
  gh api --paginate "orgs/$org/repos?type=public&per_page=100" --jq "$FIELDS" | node -e '
let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const all=s.trim().split("\n").flatMap(l=>JSON.parse(l));process.stdout.write(JSON.stringify(all,null,1)+"\n")})' > "$OUT/repos-$org.json"
  gh api "orgs/$org" --jq '{login, name, description, blog, html_url, public_repos, followers, created_at}' > "$OUT/org-$org.json"
done
# Drop auto-generated AI solver log repositories (hundreds of "log-tmp-*solution-draft-log*" repos).
node -e '
const f=process.argv[1];const r=JSON.parse(require("fs").readFileSync(f,"utf8"));
require("fs").writeFileSync(f,JSON.stringify(r.filter(x=>!/^log-tmp-|solution-draft-log/i.test(x.name)),null,1)+"\n")' "$OUT/repos-konard.json"
