import os, json

from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from google.oauth2 import service_account

SPREADSHEET_ID = "1BzwZJhv1WTIeknXeY_S4EEMiHwZEgMCJvNzWb9VeJjE"
RANGE_NAME = "Sheet1!A2:D"

def get_google_sheets_service():
    # Get credentials from the environment variable
    google_credentials = os.getenv("GOOGLE_CREDENTIALS")

    if not google_credentials:
        raise ValueError("Google credentials not found in environment variables.")

    # Parse the JSON string from the environment variable
    creds_dict = json.loads(google_credentials)

    # Convert the dictionary to credentials object
    creds = service_account.Credentials.from_service_account_info(
        creds_dict,
        scopes=["https://www.googleapis.com/auth/spreadsheets"]
    )

    # Build the Google Sheets API service
    return build("sheets", "v4", credentials=creds)


def sync_to_google_sheets(leads_data):
    service = get_google_sheets_service()
    values = [[l['name'], l['phone'], l['note'], l['timestamp']] for l in leads_data]
    body = {"values": values}
    service.spreadsheets().values().append(
        spreadsheetId=SPREADSHEET_ID,
        range=RANGE_NAME,
        valueInputOption="RAW",
        body=body
    ).execute()
