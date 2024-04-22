# Welcome to Cloud Functions for Firebase for Python!
# To get started, simply uncomment the below code or create your own.
# Deploy with `firebase deploy`

from firebase_functions import https_fn
from firebase_admin import initialize_app, firestore
from google.cloud.firestore_v1.client import Client
from google.cloud.firestore_v1.field_path import FieldPath

initialize_app()


@https_fn.on_request(region="europe-west1")
def get_my_decks(req: https_fn.Request) -> https_fn.Response:
    firestore_client = Client(
        database="flashcards")
    d = firestore_client.collection(
        "users")

    return https_fn.Response("coucou leo ça gaz ?")
