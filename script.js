const BOT_TOKEN = '8804333424:AAFKquGlqxwYIsverAqf4XQFhTGipTX6acI';
const CHAT_ID = '6472310925';

// এয়ারটেবল কনফিগ
const AT_TOKEN = 'আপনার_এয়ারটেবল_টোকেন_এখানে_দিন';
const AT_BASE_ID = 'আপনার_বেস_আইডি_এখানে_দিন';
const AT_TABLE_NAME = 'Table 1'; // আপনার টেবিলের নাম

function openForm(method, number) {
    document.getElementById('deposit-form').classList.remove('hidden');
    document.getElementById('method-title').innerText = method + " ডিপোজিট";
    document.getElementById('display-number').innerText = number;
}

async function processAll() {
    const userId = document.getElementById('user-id').value;
    const trxId = document.getElementById('trx-id').value;
    const method = document.getElementById('method-title').innerText;
    const statusText = document.getElementById('status-text');
    const submitBtn = document.getElementById('submit-btn');

    if (!userId || !trxId) {
        alert("সবগুলো তথ্য দিন!");
        return;
    }

    // বাটন লক করা
    submitBtn.disabled = true;
    submitBtn.innerText = "প্রসেসিং...";
    statusText.style.display = "block";
    statusText.innerText = "অপেক্ষা করুন...";
    statusText.style.color = "blue";

    try {
        // ১. এয়ারটেবলে ডাটা সেভ করা
        const atUrl = `https://api.airtable.com/v0/${AT_BASE_ID}/${AT_TABLE_NAME}`;
        const atData = {
            fields: {
                "Name": userId,
                "Method": method,
                "TrxID": trxId,
                "Status": "Pending"
            }
        };

        const atResponse = await fetch(atUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AT_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(atData)
        });

        // ২. টেলিগ্রামে মেসেজ পাঠানো
        const tgMsg = `🔔 নতুন ডিপোজিট!\n💎 মেথড: ${method}\n🆔 ইউজার: ${userId}\n🧾 TrxID: ${trxId}\n⏳ স্ট্যাটাস: Pending`;
        const tgUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(tgMsg)}`;
        
        const tgResponse = await fetch(tgUrl);

        if (atResponse.ok && tgResponse.ok) {
            statusText.innerText = "কনফার্ম হয়েছে! অ্যাডমিন চেক করছে।";
            statusText.style.color = "green";
            alert("আপনার রিকোয়েস্ট সফলভাবে জমা হয়েছে।");
            setTimeout(() => location.reload(), 2000);
        } else {
            throw new Error("Failed to send data");
        }

    } catch (error) {
        console.error(error);
        statusText.innerText = "রিজেক্ট হয়েছে বা ভুল হয়েছে। আবার চেষ্টা করুন।";
        statusText.style.color = "red";
        submitBtn.disabled = false;
        submitBtn.innerText = "আবার চেষ্টা করুন";
    }
}
