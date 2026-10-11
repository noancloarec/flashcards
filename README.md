# flashcards

## Getting started

```sh
npm install
npm run dev
```

### Secure firestore rules

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Collection: deck
    // Everyone can read; only the verified owner can write.
    match /deck/{documentId} {
      allow read: if true;

      allow write: if request.auth != null
                   && request.auth.token.email == 'owner@gmail.com'
                   && request.auth.token.email_verified == true;
    }

    // Collection: archived_deck
    // Only the verified owner can read and write.
    match /archived_deck/{documentId} {
      allow read, write: if request.auth != null
                         && request.auth.token.email == 'owner@gmail.com'
                         && request.auth.token.email_verified == true;
    }

    // Collection: memorization_status
    // Verified users can access only their own document.
    match /memorization_status/{userEmail}/{document=**} {
      allow read, write: if request.auth != null
                         && request.auth.token.email == userEmail
                         && request.auth.token.email_verified == true;
    }

    // All other documents and collections are denied by default.
  }
}
```
