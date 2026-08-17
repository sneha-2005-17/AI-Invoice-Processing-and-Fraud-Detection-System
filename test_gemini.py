import google.generativeai as genai

API_KEY = "AQ.Ab8RN6IHPsgXEvUjdpk3A4LOSEebCqdecMeX-LfAU6DSuRWnlw"
genai.configure(api_key=API_KEY)

model = genai.GenerativeModel("gemini-2.0-flash")

try:
    response = model.generate_content("Hello")
    print(response.text)
except Exception as e:
    print(e)

