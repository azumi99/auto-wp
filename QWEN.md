## Qwen Added Memories
- WP Auto is a multi-tenant WordPress content management system with AI-powered content generation and n8n automation. The app is built with Next.js 14+, TypeScript, Tailwind CSS, shadcn/ui, and uses Supabase for authentication and database. The current issue is that users are getting an "Email not confirmed" error when trying to sign in, which happens when users haven't clicked the confirmation link in their email after registering. I've implemented a fix by:
🧩 WordPress AI Content Management System (Auto Article Generation & Posting)

I want to build a content management system similar to WordPress, specifically focused on AI-generated articles and auto-posting to multiple WordPress websites.

Here's what I need:

User Website Management

Websites owned by each user.

Each user can manage their own websites.

Website List

A list of websites with fields such as name, URL, and credentials (for WordPress API access).

Article List

A list of article titles.

I already have an n8n workflow and webhook for content generation, so I only need to store and trigger two parameters: title and datetime.

The list should support filtering by website or user.

Published Articles

A list of articles that have already been successfully posted.

Each record should show the thumbnail image, title, article URL, and publish date.

Webhook Management

Ability to store and manage the n8n webhook URL used to trigger article generation and posting.

AI Prompt Management

A section to save and manage AI prompts used for generating articles (editable templates).

🧱 Database Schema — WP Auto (AI WordPress CMS)
1. websites

Menyimpan data website yang dimiliki user (WordPress site info).

Field	Type	Description
id	uuid (PK)	Unique website ID
user_id	uuid (FK → users.id)	Related user
name	text	Website name
url	text	Website URL
wp_username	text	WordPress username
wp_password	text	WordPress password (encrypted)
wp_token	text	Optional JWT/API token
created_at	timestamptz	Creation date
updated_at	timestamptz	Last update
2. articles

Menyimpan daftar artikel yang akan digenerate oleh AI.

Field	Type	Description
id	uuid (PK)	Unique article ID
website_id	uuid (FK → websites.id)	Target website
user_id	uuid (FK → users.id)	Related user
title	text	Article title
scheduled_at	timestamptz	Scheduled time for generation/post
status	text	pending / processing / posted / failed
webhook_id	uuid (FK → webhooks.id)	n8n webhook trigger
created_at	timestamptz	Creation date
updated_at	timestamptz	Last update
3. published_articles

Menyimpan hasil artikel yang sudah berhasil diposting ke WordPress.

Field	Type	Description
id	uuid (PK)	Unique post record
article_id	uuid (FK → articles.id)	Original AI-generated article
website_id	uuid (FK → websites.id)	Posted to which website
user_id	uuid (FK → users.id)	Related user
title	text	Post title
excerpt	text	Short summary
image_url	text	Featured image
post_url	text	URL of the published post
published_at	timestamptz	Publish date
created_at	timestamptz	Record creation
4. webhooks

Menyimpan URL webhook untuk trigger ke n8n.

Field	Type	Description
id	uuid (PK)	Unique webhook ID
user_id	uuid (FK → users.id)	Related user
name	text	Webhook name (e.g., "Article Generator")
url	text	n8n webhook endpoint
active	boolean	Whether the webhook is active
created_at	timestamptz	Creation date
5. ai_prompts

Menyimpan template prompt yang digunakan untuk Qwen CLI / AI generator.

Field	Type	Description
id	uuid (PK)	Unique prompt ID
user_id	uuid (FK → users.id)	Related user
name	text	Prompt name (e.g., "Default SEO Blog Prompt")
template	text	Full AI prompt template
created_at	timestamptz	Creation date
updated_at	timestamptz	Last update
6. users (Supabase default table)

Untuk login/auth Supabase (tidak perlu dibuat manual).

Field	Type	Description
id	uuid (PK)	User ID
email	text	User email
password	text	(hashed by Supabase)
email_confirmed_at	timestamptz	Confirmation time
created_at	timestamptz	Creation date