# Social networks probe (issue #7)

Probed 2026-10-19 from the CI/dev machine, without any credentials (no X, Telegram or VK tokens
in the environment). `UA` = desktop Chrome user agent unless stated otherwise.
Archiver: `node experiments/archive-posts.cjs` -> `posts.json`.

## Summary

| Network | Listing (discover posts) | Single post | Archived |
| --- | --- | --- | --- |
| X `@drakonard` | Not public (timeline needs login, mirrors are dead) | Public JSON (`cdn.syndication.twimg.com/tweet-result`) | 3 tweets (2020-08-23 .. 2025-11-17), IDs listed by hand in `post-urls.txt` |
| Telegram `t.me/drakonard` | No feed: it is a **personal account**, not a channel. No public channel owned by konard was found | n/a | 0 |
| VK `vk.com/konard` (owner id `3972090`) | Server-rendered HTML is served only to search-engine crawlers | Same, with schema.org `SocialMediaPosting` | 60 own posts (2025-10-21 .. 2026-10-05) |

## X

```
curl -s 'https://syndication.twitter.com/srv/timeline-profile/screen-name/drakonard'
# 200, 2221 bytes: __NEXT_DATA__ ... "timeline":{"entries":[]}   <- empty without login cookies
curl -s 'https://publish.twitter.com/oembed?url=https://twitter.com/drakonard'
# 200: {"html":"<a class=\"twitter-timeline\" href=\"https://x.com/drakonard?...\">Posts by drakonard</a>..."}
#      (only the JS widget placeholder; timeline is rendered client-side and requires login)
curl -s -A "$UA" https://x.com/drakonard            # 200, JS shell, no tweet IDs
curl -s -A Googlebot https://x.com/drakonard        # 403
curl -s https://xcancel.com/drakonard/rss           # 451 "XCancel service is suspended."
curl -s https://nitter.net/drakonard/rss            # 410
curl -s https://nitter.tiekoetter.com/drakonard/rss # 200 "Making sure you're not a bot!" (Anubis JS challenge)
curl -s https://nitter.space/drakonard/rss          # 403
curl -s https://rsshub.app/twitter/user/drakonard   # 404
curl -s 'https://web.archive.org/cdx/search/cdx?url=twitter.com/drakonard/status/*&output=json' # 429 Too Many Requests
```

Single tweets are public:

```
curl -s 'https://cdn.syndication.twimg.com/tweet-result?id=1990323098562994545&token=x&lang=en'
# 200: {"__typename":"Tweet","created_at":"2025-11-17T07:36:19.000Z","text":"@AnthropicAI has banned our account, ...","mediaDetails":[...4 photos]}
curl -s 'https://cdn.syndication.twimg.com/tweet-result?id=1&token=x'   # 404 -> archiver sets unavailableAt
```

Tweet IDs were discovered via GitHub search (`gh api search/issues -f q='"drakonard/status"'`:
konard/twittermatrix#8, link-assistant/hive-mind#748) and web search (status 1297535286906433538).
**Blocker:** without an X API token or logged-in session there is no way to list the timeline, so new
tweets must be appended to `post-urls.txt` (or a token-based listing added later).

## Telegram

```
curl -s -A "$UA" -o /dev/null -w '%{http_code} %{redirect_url}' https://t.me/s/drakonard
# 302 https://t.me/drakonard   (t.me/s/ redirects for non-channels)
curl -s https://t.me/drakonard | grep -o 'tgme_action_button_new[^<]*'
# tgme_action_button_new shine" href="tg://resolve?domain=drakonard">Send Message   <- user account
```

Candidates checked with `t.me/s/<name>` (302 = not a public channel):
`konard` (302, another person "Эд"), `linksplatform`, `deep_foundation`, `link_foundation`,
`drakonard_channel`, `link_assistant`, `linkassistant`, `deep_assistant`, `links_platform`,
`konard_channel`, `drakonard_blog` (all 302 "Telegram: Contact"), `linkfoundation` (302, unrelated
6-member group), `deepgpt` (302, group "Deep.GPT", 76 members, no public preview),
`deepfoundation` (200, unrelated drilling-equipment channel), `deepassistant` (200, unrelated "PicaHub"),
`deep_gpt` (200, "Deep GPT", only 2 service messages from 2025-02-06, ownership unverified).
GitHub profile/social accounts, konard/konard README and org profile READMEs (link-foundation,
deep-foundation, deep-assistant, linksplatform, link-assistant) only link `t.me/drakonard`
(and the bot `t.me/DeepGPTBot`). VK posts also only reference `t.me/drakonard`.
The archiver's Telegram code (`--telegram=<channel>` and `t.me/<channel>/<id>` URLs) was verified
against the public channel `durov` (25 posts with text, links and photo/video media parsed) in a
scratch output, not committed.

## VK

```
curl -s 'https://api.vk.com/method/wall.get?domain=konard&count=5&v=5.199'
# 200 {"error":{"error_code":15,"error_msg":"Access denied: token required",...}}
curl -sL -A "$UA" https://vk.com/konard      # 200, "<title>VK | VK", JS challenge (window.isRedirectChallenge), no posts
curl -sL -A "$UA" https://m.vk.com/konard    # 200, same challenge page
curl -sL -A 'Mozilla/5.0 (iPhone; ...)' https://m.vk.com/konard   # 200, challenge, no posts
curl -sL -A 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' https://m.vk.com/konard
# 200, 1.4 MB SSR HTML, 10 posts: data-testid="post" data-post-id="3972090_31776" data-post-nesting-lvl="0" ...
curl -sL -A Googlebot 'https://m.vk.com/wall3972090?own=1&offset=10'   # 200, next 10 own posts
curl -sL -A Googlebot https://vk.com/wall3972090_31776                 # 200 -> https://vk.ru/wall3972090_31776
# <script type="application/ld+json">{"@type":"SocialMediaPosting","datePublished":"2026-10-05T08:45:38+03:00",
#   "author":{"name":"Константин Дьяченко","url":"https://vk.ru/konard"},...}
```

Notes and caveats:

- Only the crawler user agent gets content; this works today but VK can change it at any time,
  and using a search-engine UA is a gray area. The clean alternative is a VK service token
  (`wall.get` with `access_token`), which this machine does not have.
- The unfiltered wall also contains posts by other people (birthday greetings); the archiver uses
  `?own=1` so only konard's posts are stored.
- Post pages rendered for crawlers append a "Последние записи:" (recent posts) link list to the text;
  the archiver strips it.
- VK shows shortened link text (`github.com/link-found...`); the full URL is kept in `href` and in `text`.
- Photo URLs (`sun9-*.userapi.com`/`vkuserphoto.ru`, signed) and video previews (`okcdn.ru`) may expire;
  the archive stores URLs, not image bytes.
- VK groups with public walls (same method works): `vk.com/linksplatform` (owner -102591034),
  `vk.com/deep_foundation` (owner -60755738); not archived by default (`--vk=konard,linksplatform,...`).
- konard publishes English and Russian versions of the same VK post minutes apart (e.g. wall3972090_31766
  "Do you have a GitHub account?" and wall3972090_31765 "У тебя есть аккаунт на GitHub?", 2 minutes apart):
  19 en/ru post combinations published within 1 hour of each other in the archived range, useful for the dedup/language rule.
