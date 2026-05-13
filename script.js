const BOT_TOKEN = '8804333424:AAFKquGlqxwYIsverAqf4XQFhTGipTX6acI';
const CHAT_ID = '6472310925';

function openForm(method, number) {
    document.getElementById('deposit-form').classList.remove('hidden');
    document.getElementById('method-title').innerText = method + " ডিপোজিট";
    document.getElementById('display-number').innerText = number;
}

function sendToTelegram() {
    const userId = document.getElementById('user-id').value;
    const trxId = document.getElementById('trx-id').value;
    const method = document.getElementById('method-title').innerText;

    if (!userId || !trxId) {
        alert("সবগুলো তথ্য দিন!");
        return;
    }

    const message = `🔔 নতুন ডিপোজিট রিকোয়েস্ট!\n💎 মেথড: ${method}\n🆔 ইউজার আইডি: ${userId}\n🧾 TrxID: ${trxId}`;
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(message)}`;

    fetch(url)
    .then(response => {
        if (response.ok) {
            alert("আপনার রিকোয়েস্ট সফলভাবে পাঠানো হয়েছে! অপেক্ষা করুন।");
            location.reload();
        } else {
            alert("মেসেজ পাঠাতে সমস্যা হয়েছে। আপনার বটের চ্যাট আইডি এবং টোকেন চেক করুন।");
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert("সমস্যা হয়েছে, ইন্টারনেট সংযোগ চেক করুন।");
    });
}
