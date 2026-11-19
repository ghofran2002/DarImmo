# DarImmo Backend

REST API for the DarImmo mobile clients.

## Setup

```powershell
cd backend
Copy-Item .env.example .env
npm install
npm start
```

The default base URL is `http://localhost:5000`. The server requires
`MONGODB_URI`, `JWT_SECRET`, and `JWT_EXPIRES_IN`. Cloudinary variables are
required for image uploads. Firebase Admin variables are optional; without
them, notifications are stored in MongoDB but push delivery is not performed.

## Authentication

Register and login return a JWT in `data.token`. Send it on private routes:

```http
Authorization: Bearer <token>
```

All responses use `{ "success": boolean, "message": string, "data": {} }`;
validation and error responses additionally include `errors`.

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---:|---|
| GET | `/` | No | API welcome response |
| GET | `/api/health` | No | Server and database status |
| POST | `/api/auth/register` | No | Create a user (`name`, `email`, `password`, optional `phone`, `role`) |
| POST | `/api/auth/login` | No | Login (`email`, `password`) |
| GET | `/api/auth/me` | Yes | Current user |
| GET | `/api/users/profile` | Yes | Current profile |
| PUT | `/api/users/profile` | Yes | Update `name`, `phone`, or `avatar` |
| PUT | `/api/users/password` | Yes | Change password |
| GET | `/api/properties` | No | Approved properties; supports `search`, `city`, `type`, `transactionType`, `minPrice`, `maxPrice`, `sort`, `page`, and `limit` |
| GET | `/api/properties/nearby` | No | Nearby approved properties using `lng`, `lat`, and optional `distance` in metres |
| GET | `/api/properties/:id` | No | Property details |
| POST | `/api/properties` | Yes | Create a property; it starts as `pending` |
| PUT | `/api/properties/:id` | Yes | Update the owner's property |
| DELETE | `/api/properties/:id` | Yes | Delete the owner's property |
| POST | `/api/properties/:id/images` | Yes | Upload up to five total images, `multipart/form-data` field `images` |
| DELETE | `/api/properties/:id/images/:publicId` | Yes | Delete one owned property image |
| GET | `/api/favorites` | Yes | List current user's favorites |
| POST | `/api/favorites/:propertyId` | Yes | Add a favorite |
| DELETE | `/api/favorites/:propertyId` | Yes | Remove a favorite |
| GET | `/api/messages` | Yes | List conversations |
| POST | `/api/messages` | Yes | Send `{ "receiver": "<userId>", "content": "...", "property": "<optionalPropertyId>" }` |
| GET | `/api/messages/:userId` | Yes | Conversation history |
| GET | `/api/notifications` | Yes | Notifications and unread count |
| PUT | `/api/notifications/:id/read` | Yes | Mark one notification as read |
| PUT | `/api/notifications/read-all` | Yes | Mark all notifications as read |
| POST | `/api/notifications/device-token` | Yes | Register an FCM device token |

## Limits and roles

- Message content is trimmed and limited to 1,000 characters.
- Property image uploads accept JPEG, PNG, and WebP files up to 5 MB each,
  with a maximum of five images per property.
- Registration accepts `user` and `agent`; `admin` is not assignable through
  public registration.
- Invalid message IDs, filters, coordinates, and pagination parameters return
  HTTP 400; unknown resources return HTTP 404.
- MongoDB, Cloudinary, and Firebase credentials must be supplied through
  environment variables; never commit `.env`.
