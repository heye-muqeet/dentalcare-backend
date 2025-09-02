# Dental Care Backend (Sails.js)

Production‑ready Sails.js API for the Dental Care platform. Provides JWT (cookie) auth, RBAC, and REST endpoints for users, patients, appointments, treatments, invoices, payments, expenses, media, reports, and dashboard metrics.

## Quick Start
```bash
npm install
npm run dev
# http://localhost:1337
```

## Environment
Set these variables (e.g. `.env`):
- DATABASE_URL – MongoDB connection string
- JWT_SECRET – JWT signing secret
- CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
- EMAIL_SERVICE, EMAIL_USER, EMAIL_PASS

## Useful Scripts
- dev: Nodemon lift (development)
- start: Production lift

## Documentation
- Detailed backend docs: `./DOCUMENTATION.md`
- Full project docs: `../DOCUMENTATION.md`
- Postman collection: `DentalCare_API_Collection.json`
- Expense API: `EXPENSE_API_DOCUMENTATION.md`

## Notes
- Cookies use `SameSite=None; Secure` → require HTTPS in production
- CORS configured in `config/security.js` with `allowCredentials: true`

---

Original Sails template follows:

# dental-backend

a [Sails v1](https://sailsjs.com) application


### Links

+ [Sails framework documentation](https://sailsjs.com/get-started)
+ [Version notes / upgrading](https://sailsjs.com/documentation/upgrading)
+ [Deployment tips](https://sailsjs.com/documentation/concepts/deployment)
+ [Community support options](https://sailsjs.com/support)
+ [Professional / enterprise options](https://sailsjs.com/enterprise)


### Version info

This app was originally generated on Fri May 16 2025 16:15:25 GMT+0500 (Pakistan Standard Time) using Sails v1.5.14.

<!-- Internally, Sails used [`sails-generate@2.0.13`](https://github.com/balderdashy/sails-generate/tree/v2.0.13/lib/core-generators/new). -->



<!--
Note:  Generators are usually run using the globally-installed `sails` CLI (command-line interface).  This CLI version is _environment-specific_ rather than app-specific, thus over time, as a project's dependencies are upgraded or the project is worked on by different developers on different computers using different versions of Node.js, the Sails dependency in its package.json file may differ from the globally-installed Sails CLI release it was originally generated with.  (Be sure to always check out the relevant [upgrading guides](https://sailsjs.com/upgrading) before upgrading the version of Sails used by your app.  If you're stuck, [get help here](https://sailsjs.com/support).)
-->

