import os
import sys
import time
from dotenv import load_dotenv
from moorcheh_sdk import MoorchehClient

# Load env vars from api-server
dotenv_path = os.path.join(os.path.dirname(__file__), '../artifacts/api-server/.env')
load_dotenv(dotenv_path)

api_key = os.environ.get("MOORCHEH_API_KEY")
NAMESPACE = 'insurewise-knowledge'

if not api_key:
    print("❌ MOORCHEH_API_KEY is not set in artifacts/api-server/.env")
    sys.exit(1)

KNOWLEDGE_DOCS = [
    {
        "id": "pc-auto-01",
        "text": "PC Auto Insurance offers comprehensive and collision coverage. They are known for their forgiving policy on minor infractions—they typically ignore traffic tickets older than 3 years when calculating premiums. They also offer a 10% discount for bundling home and auto insurance.",
        "title": "PC Insurance Auto Details",
        "category": "auto",
        "provider": "PC Insurance"
    },
    {
        "id": "desjardins-life-01",
        "text": "Desjardins Life Insurance provides term life policies ranging from 10 to 30 years, as well as permanent whole life options. They cover a wide array of pre-existing conditions if disclosed upfront, but have strict exclusionary periods (usually 2 years) for undisclosed severe illnesses.",
        "title": "Desjardins Life Insurance Terms",
        "category": "life",
        "provider": "Desjardins"
    },
    {
        "id": "general-auto-01",
        "text": "Comprehensive coverage protects your car against damage not caused by a collision, such as theft, vandalism, fire, or weather. Collision coverage pays to repair or replace your car if it's damaged in an accident with another vehicle or object, regardless of who is at fault.",
        "title": "Comprehensive vs Collision",
        "category": "education",
        "provider": "General"
    },
    {
        "id": "general-home-01",
        "text": "Standard home insurance policies typically do not cover flood damage or earthquake damage unless specific riders are purchased. They do cover fire, theft, and liability if someone is injured on your property.",
        "title": "Home Insurance Exclusions",
        "category": "education",
        "provider": "General"
    },
    {
        "id": "insurewise-platform-01",
        "text": "InsureWise is an intelligent, user-friendly insurance platform designed to simplify the insurance shopping and application process. It leverages AI, including the Moorcheh semantic memory RAG engine, to provide context-aware, verifiable answers to user questions, optimize insurance premiums, and smartly pre-fill application forms.",
        "title": "What is InsureWise",
        "category": "platform",
        "provider": "InsureWise"
    }
]

def main():
    print(f"🐜 Connecting to Moorcheh APIs using Python SDK...")

    try:
        with MoorchehClient(api_key=api_key) as client:
            
            # 1. Create or verify Namespace
            print(f"\n📦 Creating/Verifying namespace '{NAMESPACE}'...")
            try:
                create_res = client.namespaces.create(namespace_name=NAMESPACE, type="text")
                print(f"✅ Namespace response: {create_res.get('message', 'Success')}")
            except Exception as e:
                # If namespace already exists, the SDK might raise an error
                print(f"Notice (Namespace might already exist): {e}")

            # 2. Upload text documents
            print(f"\n📄 Uploading {len(KNOWLEDGE_DOCS)} knowledge documents...")
            try:
                upload_res = client.documents.upload(namespace_name=NAMESPACE, documents=KNOWLEDGE_DOCS)
                print(f"✅ Upload success! Documents processed: {upload_res.get('documents_processed')}")
                print(f"Status: {upload_res.get('processing_status')}")
            except Exception as e:
                print(f"❌ Failed to upload documents: {e}")
                sys.exit(1)

        print(f"\n🎉 Seeding complete. The data will be available for search shortly.")
        
    except Exception as e:
        print(f"❌ Initialization Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
