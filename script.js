const BOT_TOKEN = '8804333424:AAFKquGlqxwYIsverAqf4XQFhTGipTX6acI';
const CHAT_ID = '6472310925';

const AT_TOKEN = 'patzXdNIbu5pFhUFY.6586827607f7dcaf7830c872e03f599acfc7f392c891693efd9cf73b7fbe5441';
const AT_BASE_ID = 'appEiZDN5IcHoGjSe';
const AT_TABLE_NAME = 'Table 1'; 

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

    submitBtn.disabled = true;
    submitBtn.innerText = "প্রসেসিং...";
    statusText.style.display = "block";
    statusText.innerText = "রিকোয়েস্ট পাঠানো হচ্ছে...";
    statusText.style.color = "blue";

    try {
        // ১. এয়ারটেবলে ডাটা পাঠানো
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

        const result = await atResponse.json();
        const recordId = result.id; // এই আইডি দিয়ে পরে স্ট্যাটাস চেক করবো

        // ২. টেলিগ্রামে পাঠানো
        const tgMsg = `🔔 নতুন ডিপোজিট!\n💎 মেথড: ${method}\n🆔 ইউজার: ${userId}\n🧾 TrxID: ${trxId}\n⏳ স্ট্যাটাস: Pending`;
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(tgMsg)}`);

        if (atResponse.ok) {
            statusText.innerText = "অপেক্ষা করুন, অ্যাডমিন চেক করছে...";
            // ৩. এখন স্ট্যাটাস চেক করা শুরু হবে (প্রতি ৫ সেকেন্ডে একবার)
            checkStatus(recordId);
        }

    } catch (error) {
        statusText.innerText = "সমস্যা হয়েছে। আবার চেষ্টা করুন।";
        submitBtn.disabled = false;
    }
}

function checkStatus(recordId) {
    const statusText = document.getElementById('status-text');
    
    const interval = setInterval(async () => {
        try {
            const checkUrl = `https://api.airtable.com/v0/${AT_BASE_ID}/${AT_TABLE_NAME}/${recordId}`;
            const response = await fetch(checkUrl, {
                headers: { 'Authorization': `Bearer ${AT_TOKEN}` }
            });
            const data = await response.json();
            const currentStatus = data.fields.Status;

            if (currentStatus === "Confirm") {
                statusText.innerText = "✅ পেমেন্ট কনফার্ম হয়েছে!";
                statusText.style.color = "green";
                clearInterval(interval); // চেক করা বন্ধ হবে
            } else if (currentStatus === "Reject") {
                statusText.innerText = "❌ পেমেন্ট রিজেক্ট করা হয়েছে!";
                statusText.style.color = "red";
                clearInterval(interval); // চেক করা বন্ধ হবে
            }
        } catch (e) {
            console.log("Checking status...");
        }
    }, 5000); // প্রতি ৫ সেকেন্ড পর পর চেক করবে
}
