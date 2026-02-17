import asyncio
import logging
import os
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.types import Message
import google.generativeai as genai

# --- الإعدادات ---
# ملاحظة: يفضل وضع التوكنات هنا مباشرة أو استخدام متغيرات البيئة
TELEGRAM_TOKEN = "7783818199:AAF_YVpfNrVnLpxthvaUn4FP2yetsIE2N3U"
GEMINI_API_KEY = "ضغ_هنا_مفتاح_جوجل_Gemini" 

# إعداد الذكاء الاصطناعي
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-pro')

# إعداد البوت
bot = Bot(token=TELEGRAM_TOKEN)
dp = Dispatcher()

@dp.message(Command("start"))
async def cmd_start(message: Message):
    await message.reply("👋 أهلاً بك! أنا بوت الذكاء الاصطناعي الخاص بك. اسألني أي شيء!")

@dp.message()
async def handle_message(message: Message):
    if not message.text: return
    await bot.send_chat_action(chat_id=message.chat.id, action="typing")
    try:
        response = model.generate_content(message.text)
        await message.answer(response.text, parse_mode="Markdown")
    except Exception as e:
        logging.error(f"Error: {e}")
        await message.answer("عذراً، حدث خطأ ما. حاول لاحقاً.")

async def main():
    logging.basicConfig(level=logging.INFO)
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())