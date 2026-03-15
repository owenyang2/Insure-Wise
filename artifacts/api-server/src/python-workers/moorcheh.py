import sys
import json
import os
from moorcheh_sdk import MoorchehClient

def main():
    # Read strict JSON input from stdin
    input_data = sys.stdin.read()
    try:
        data = json.loads(input_data)
    except json.JSONDecodeError:
        print(json.dumps({"error": "Invalid input JSON"}))
        sys.exit(1)

    api_key = os.environ.get("MOORCHEH_API_KEY")
    if not api_key:
        print(json.dumps({"error": "Missing MOORCHEH_API_KEY environment variable"}))
        sys.exit(1)

    query = data.get("query", "")
    namespace = data.get("namespace", "insurewise-knowledge")
    chat_history_raw = data.get("chatHistory", [])
    
    chat_history = []
    for msg in chat_history_raw:
        role = msg.get("role")
        content = msg.get("content")
        if role in ["user", "assistant"] and content:
            chat_history.append({"role": role, "content": content})
            
    header_prompt = "You are an expert insurance assistant for InsureWise. Answer the user's queries concisely and factually based on the provided documents. Do not use conversational filler or introduce yourself unless greeting them."
    
    try:
        with MoorchehClient(api_key=api_key) as client:
            res = client.answer.generate(
                namespace=namespace, 
                query=query, 
                chat_history=chat_history,
                header_prompt=header_prompt
            )
            
            # The moorcheh response contains 'answer' and 'contextCount' natively per docs
            result = {
                "answer": res.get("answer", "No answer found"),
                "contextCount": res.get("contextCount", 0)
            }
            # Print strictly JSON out to stdout for Node to read
            print(json.dumps(result))

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
