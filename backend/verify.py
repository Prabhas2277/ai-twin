try:
    import fastapi
    import sqlalchemy
    import google.generativeai
    import chromadb
    print("ALL OK")
except Exception as e:
    print("ERROR:", e)
