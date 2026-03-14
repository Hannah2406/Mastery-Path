# Go to Market + Deploy to AWS: A Learning Guide

This guide teaches you how to **go to market** with your app and how to **deploy it on AWS** so real users can use it. It’s written so you learn the concepts and steps, not just copy-paste.

---

## Part 1: Go to Market — The Big Picture

### What “go to market” means

- **Ship something real** that people can use (not just on your laptop).
- **Get it in front of users** (link, landing page, or app store).
- **Learn from usage** and improve (feedback, analytics, fixes).

You don’t need “perfect” to launch. You need **working, safe, and understandable**.

### Before you deploy

1. **Define your MVP**  
   For Mastery Path: users can sign up, pick or generate a path, practice nodes, get AI-generated questions. That’s enough to ship.

2. **Security checklist**
   - No secrets in git (use `.env` and never commit it; AWS will give you env vars / secrets).
   - HTTPS in production (AWS gives you this via load balancer or CloudFront).
   - Strong DB password and restricted DB access (only your app server, not the whole internet).

3. **What you need to run in production**
   - **Database:** PostgreSQL (persistent).
   - **Backend:** Spring Boot (Java 17) — needs a JVM and your JAR.
   - **Frontend:** Static files (HTML, JS, CSS) from Vite build — needs a web server or CDN.
   - **Secrets:** API keys (e.g. Gemini), DB URL, session secret — in env vars or a secrets manager.

Once that’s clear, deployment is: put each piece on a server or managed service, point the frontend at the backend URL, and the backend at the DB URL.

---

## Part 2: AWS — Concepts You Need

### Regions and accounts

- **Region:** A physical location (e.g. `us-east-1`, `eu-west-1`). Pick one close to your users; everything you create (DB, server, etc.) lives in that region.
- **Account:** Your AWS account. Use IAM users/roles with minimal permissions; avoid using the root user for daily work.

### Services you’ll use (and why)

| Service | What it is | Why use it for Mastery Path |
|--------|------------|-----------------------------|
| **RDS** | Managed relational database | Run PostgreSQL without managing the OS; backups and patches handled by AWS. |
| **EC2** | Virtual server (Linux/Windows) | Run your Spring Boot JAR and (optionally) serve frontend or run Docker. |
| **Elastic Beanstalk** | Platform that runs your app on EC2 (or Docker) | Easiest way to run a Spring Boot app: upload JAR, set env vars, get a URL and scaling. |
| **S3** | Object storage (files in “buckets”) | Store your built frontend (HTML/JS/CSS); cheap and durable. |
| **CloudFront** | CDN (content delivery network) | Serve the frontend from S3 over HTTPS with a custom domain. |
| **Secrets Manager** or **Systems Manager Parameter Store** | Store secrets (DB password, API keys) | Avoid hardcoding; app reads them at startup or from env. |

You don’t have to use all of these. A minimal path is: **RDS (Postgres) + Elastic Beanstalk (backend) + S3 + CloudFront (frontend)**. That’s what this guide focuses on.

### How the pieces connect

```
User browser
    → CloudFront (HTTPS, your domain or xxx.cloudfront.net)
        → S3 (frontend static files)
    → API calls from frontend
        → Same CloudFront or direct to Elastic Beanstalk URL (backend)
            → Spring Boot app (EC2 under the hood)
                → RDS PostgreSQL
```

You’ll configure the frontend’s “API base URL” to point to your Beanstalk URL (or a custom domain that points to Beanstalk).

---

## Part 3: Step-by-Step — Deploy to AWS

### Prerequisites

- AWS account ([aws.amazon.com](https://aws.amazon.com)).
- AWS CLI installed and configured (`aws configure` with an IAM user that has permissions for RDS, Beanstalk, S3, CloudFront, etc.).
- Your app runs locally with PostgreSQL (e.g. `./start-all.sh`).

### Step 1: Create a database on RDS (PostgreSQL)

1. In AWS Console: **RDS → Create database**.
2. Choose **PostgreSQL 16**, **Free tier** (or a small instance if you’re past free tier).
3. **Settings:** DB name e.g. `masterypath`, master username/password (save these somewhere safe; you’ll use them as env vars).
4. **Connectivity:**  
   - Prefer **private** in a VPC if you’ll run the app in the same VPC (e.g. Beanstalk in that VPC).  
   - For the simplest start: **Publicly accessible = Yes**, and put the DB in a **security group** that allows inbound **5432** only from your Beanstalk app’s security group (or your own IP for testing).
5. Create the DB. Note the **Endpoint** (hostname) and port (usually 5432).

**JDBC URL** will look like:

`jdbc:postgresql://<RDS-Endpoint>:5432/masterypath`

You’ll pass this and the username/password to the backend via environment variables (e.g. `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`).

**Learning takeaway:** RDS gives you a managed Postgres; your app talks to it exactly like to local Postgres, just with a different host and secure credentials.

---

### Step 2: Build and run the backend on Elastic Beanstalk

1. **Build a runnable JAR**
   ```bash
   cd backend
   mvn clean package -DskipTests
   ```
   The file will be something like `target/mastery-path-1.0.0.jar` (or whatever your `artifactId` and `version` are). This JAR is what Beanstalk will run.

2. **Create an Elastic Beanstalk application**
   - In AWS: **Elastic Beanstalk → Create application**.
   - **Platform:** Java 17 (Corretto or Amazon Linux 2 with Java 17).
   - **Application code:** Upload your JAR (or use “Sample application” first to get the env right, then replace with your JAR).

3. **Configure environment variables**
   In Beanstalk → Your environment → **Configuration → Software → Environment properties**, add at least:
   - `SPRING_DATASOURCE_URL` = `jdbc:postgresql://<RDS-Endpoint>:5432/masterypath`
   - `SPRING_DATASOURCE_USERNAME` = your RDS master user
   - `SPRING_DATASOURCE_PASSWORD` = your RDS master password
   - `GEMINI_API_KEY` (or `OPENAI_API_KEY`) if you use AI features
   - Any other keys your `application.yml` expects (e.g. session secret if you use one).

   Your Spring Boot app reads these; no need to put secrets in the JAR.

4. **Run Flyway / schema**
   Your app likely runs Flyway on startup and creates tables. If the DB is empty and the app has the right URL, the first deploy will create the schema. If you prefer to run migrations manually, you can do that from your laptop (with network access to RDS) or from a one-off task.

5. **Health**
   Beanstalk will run `java -jar your.jar`. Make sure your app listens on the port Beanstalk expects (usually 5000 for the default Java platform). If your `application.yml` uses `server.port: 8080`, check Beanstalk’s platform docs; they often map 8080 → 5000 or the other way around. Adjust if needed.

**Learning takeaway:** Beanstalk = “upload JAR + set env = running app.” You get a URL like `your-env.us-east-1.elasticbeanstalk.com`. That’s your API base URL for the frontend.

---

### Step 3: Build the frontend and put it on S3 + CloudFront

1. **Point the frontend at the backend URL**
   Your frontend has something like `const API_BASE = '/api/v1'` or an env variable for the API URL. For production, it must call the **Beanstalk URL** (or your custom domain), e.g. `https://your-env.elasticbeanstalk.com/api/v1`.  
   In Vite you can use `import.meta.env.VITE_API_URL` and set it at build time:
   ```bash
   VITE_API_URL=https://your-env.elasticbeanstalk.com npm run build
   ```
   (Use whatever your code expects; the idea is: build with the production API URL.)

2. **Build**
   ```bash
   cd frontend
   npm run build
   ```
   Output is usually `dist/` (HTML, JS, CSS).

3. **Create an S3 bucket**
   - S3 → Create bucket (e.g. `masterypath-frontend`).
   - **Block public access:** Off (so CloudFront can read; we’ll restrict access later so only CloudFront can access the bucket if you want).
   - Or: keep block public access on, and give only CloudFront (via an Origin Access Identity / OAC) permission to read. That’s the more secure pattern; tutorials for “S3 + CloudFront static website” show both.

4. **Upload the build**
   ```bash
   aws s3 sync frontend/dist s3://masterypath-frontend --delete
   ```
   So the contents of `dist/` become the root of the bucket.

5. **Create a CloudFront distribution**
   - **Origin:** S3 bucket above (or the bucket’s website endpoint if you enabled static website hosting).
   - **Default root object:** `index.html`.
   - **Error pages:** For 403/404, return `index.html` with 200 (so client-side routing works for paths like `/path/123`).
   - **HTTPS:** Use the default CloudFront certificate (xxx.cloudfront.net) or add your own domain and a certificate in ACM.

**Learning takeaway:** Frontend = static files. S3 holds the files; CloudFront serves them over HTTPS and caches them. Your “site” is the CloudFront URL (or your domain pointing to it).

---

### Step 4: CORS and API base URL

- **Backend:** Your Spring Boot app must allow requests from the frontend origin (your CloudFront URL or custom domain). Configure CORS (e.g. in Spring Security or a WebMvcConfigurer) to allow that origin for the API paths.
- **Frontend:** All API calls must go to the Beanstalk URL (or domain that points to it). So `fetch('/api/v1/...')` won’t work unless the frontend is served from the same host as the API; use a full base URL in production (e.g. `VITE_API_URL`).

---

### Step 5: Custom domain and HTTPS (optional but recommended)

- **Domain:** Buy a domain (Route 53 or any registrar).
- **Certificate:** In **AWS Certificate Manager (ACM)** request a certificate for `yourdomain.com` (and `www.yourdomain.com` if you use it). Must be in the same region as CloudFront (ACM for CloudFront is in us-east-1).
- **CloudFront:** Add an alternate domain name (CNAME) to your distribution and attach the ACM certificate.
- **Route 53:** Create an A/ALIAS record for `yourdomain.com` pointing to the CloudFront distribution. Then users go to `https://yourdomain.com` for the frontend.
- **Backend:** You can give the backend a subdomain (e.g. `api.yourdomain.com`) by pointing it to Beanstalk (or an ALB in front of Beanstalk) and putting that in the frontend’s API base URL.

**Learning takeaway:** HTTPS and a domain make the product feel real and safe. AWS gives you the pieces (ACM, CloudFront, Route 53); you wire them together.

---

## Part 4: What to Learn Next (In Order)

1. **AWS account and billing**  
   Turn on billing alerts; understand Free Tier so you don’t get surprised.

2. **Networking basics**  
   VPC, subnets, security groups. You need this to understand “why can’t my app reach the DB?” and “how do I lock down the DB?”

3. **IAM**  
   Users, roles, least privilege. Use a role for Beanstalk so it can read Secrets Manager (if you move secrets there) and no one puts passwords in code.

4. **Secrets**  
   Move DB password and API keys to **Secrets Manager** or **Parameter Store**; have the app load them at startup (or inject via Beanstalk env from a script that fetches secrets). That’s “production-grade” secrets.

5. **CI/CD**  
   GitHub Actions (or similar): on push to `main`, build JAR, build frontend, deploy to Beanstalk and S3. That’s “ship on every merge.”

6. **Monitoring**  
   CloudWatch logs and metrics; set a simple alarm on 5xx or app health so you know when something breaks.

---

## Part 5: Quick Reference — Commands You’ll Use

```bash
# Build backend
cd backend && mvn clean package -DskipTests

# Build frontend (set your Beanstalk URL)
cd frontend && VITE_API_URL=https://your-env.elasticbeanstalk.com npm run build

# Upload frontend to S3
aws s3 sync frontend/dist s3://your-bucket-name --delete

# Optional: invalidate CloudFront cache after upload
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

---

## Part 6: Go to Market Checklist

- [ ] App runs locally with production-like config (e.g. Postgres, env vars).
- [ ] RDS created; app can connect from Beanstalk (security groups allow it).
- [ ] Backend on Beanstalk; env vars set (DB, API keys); health OK.
- [ ] Frontend built with correct API URL; uploaded to S3; CloudFront serves it.
- [ ] CORS allows your frontend origin; API base URL is correct in the frontend.
- [ ] HTTPS (CloudFront + optional custom domain).
- [ ] Billing alert and basic understanding of Free Tier / costs.
- [ ] Share the link (CloudFront or your domain) and get a few people to try it.

Once this works, you’ve “gone to market” in the sense of having a live, deployable product. You can then add domain, secrets manager, CI/CD, and monitoring step by step and learn each piece.

---

## Where to Read More

- **Elastic Beanstalk:** [AWS EB Java documentation](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/java-se-platform.html)
- **RDS PostgreSQL:** [AWS RDS PostgreSQL](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html)
- **S3 + CloudFront static site:** [S3 static website](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html), [CloudFront](https://docs.aws.amazon.com/cloudfront/)
- **Spring Boot on AWS:** [Spring Boot on AWS](https://spring.io/guides/gs/spring-boot-aws/)

You’ve got the full path: go to market mindset → what runs where → RDS + Beanstalk + S3/CloudFront → CORS and URLs → domain and HTTPS → what to learn next. Use this doc as your map and adjust names (bucket, env, domain) to match what you create in the console.
