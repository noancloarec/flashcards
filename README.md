# flashcards

## Getting started

```sh
npm install
npm run dev
```

### Secure firestore rules

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;

      allow write: if request.auth != null
                  && request.auth.token.email == "owner@mail.org"
                  && request.auth.token.email_verified == true;
    }
  }
}
```
