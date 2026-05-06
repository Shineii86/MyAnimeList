#!/usr/bin/env python3
"""Batch-fetch cover images from AniList for all anime entries."""
import json, time, urllib.request, urllib.error

ANILIST_API = "https://graphql.anilist.co"
BATCH_SIZE = 50  # IDs per query
RATE_DELAY = 1.5  # seconds between requests

def query_anilist(ids):
    """Fetch cover images for a batch of AniList IDs."""
    query = """
    query ($ids: [Int]) {
        Page(page: 1, perPage: 50) {
            media(id_in: $ids, type: ANIME) {
                id
                coverImage { large medium }
            }
        }
    }
    """
    payload = json.dumps({"query": query, "variables": {"ids": ids}}).encode()
    req = urllib.request.Request(ANILIST_API, data=payload, headers={
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "MyAnimeList-Admin/1.0"
    })
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read())
            return {m["id"]: m["coverImage"]["large"] for m in data["data"]["Page"]["media"] if m.get("coverImage")}
    except Exception as e:
        print(f"  Error: {e}")
        return {}

def main():
    with open("admin-panel/data/anime.json") as f:
        data = json.load(f)

    anime = data["anime"]
    # Get unique IDs that need covers
    needs_cover = [(i, a) for i, a in enumerate(anime) if a.get("anilistId") and not a.get("coverImage")]
    all_ids = list(set(a["anilistId"] for _, a in needs_cover))
    
    print(f"Total entries: {len(anime)}")
    print(f"Need cover images: {len(needs_cover)} entries ({len(all_ids)} unique IDs)")
    print(f"Fetching in batches of {BATCH_SIZE}...\n")

    # Fetch in batches
    covers = {}
    for batch_start in range(0, len(all_ids), BATCH_SIZE):
        batch = all_ids[batch_start:batch_start + BATCH_SIZE]
        batch_num = batch_start // BATCH_SIZE + 1
        total_batches = (len(all_ids) + BATCH_SIZE - 1) // BATCH_SIZE
        print(f"  Batch {batch_num}/{total_batches} ({len(batch)} IDs)...", end=" ")
        result = query_anilist(batch)
        covers.update(result)
        print(f"got {len(result)} covers")
        if batch_start + BATCH_SIZE < len(all_ids):
            time.sleep(RATE_DELAY)

    # Apply covers to data
    updated = 0
    for i, a in enumerate(anime):
        if a.get("anilistId") and not a.get("coverImage"):
            cover = covers.get(a["anilistId"])
            if cover:
                data["anime"][i]["coverImage"] = cover
                updated += 1

    # Save
    with open("admin-panel/data/anime.json", "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"\nDone! Updated {updated} entries with cover images.")
    total_with_cover = sum(1 for a in data["anime"] if a.get("coverImage"))
    print(f"Total with covers: {total_with_cover}/{len(data['anime'])}")

if __name__ == "__main__":
    main()
