const BOT_TOKEN = '8804333424:AAFKquGlqxwYIsverAqf4XQFhTGipTX6acI';
const CHAT_ID = '6472310925';

const AT_TOKEN = 'patzXdNIbu5pFhUFY.6586827607f7dcaf7830c872e03f599acfc7f392c891693efd9cf73b7fbe5441';
const AT_BASE_ID = 'appEiZDN5IcHoGjSe';
const AT_TABLE_NAME = 'Table 1';

// পেজ লোড হওয়ার সাথে সাথে চেক করবে আগে কোনো পেন্ডিং রিকোয়েস্ট আছে কি না
window.onload = function() {
    const savedRecordId = localStorage.getItem('last_payment_id');
    if (savedRecordId) {
        document.getElementById('deposit-form').classList.remove('hidden');
        document.getElementById('status-text').style.display = "block";
        document.getElementById('status-text').innerText = "পূর্বের রিকোয়েস্টের স্ট্যাটাস চেক করা হচ্ছে...";
        checkStatus(savedRecordId);
    }
};

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
    statusText.style.display = "block";
    statusText.innerText = "রিকোয়েস্ট পাঠানো হচ্ছে...";

    try {
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
        const recordId = result.id;

        // ব্রাউজারে আইডিটি সেভ করে রাখা
        localStorage.setItem('last_payment_id', recordId);

        const tgMsg = `🔔 নতুন ডিপোজিট!\n💎 মেথড: ${method}\n🆔 ইউজার: ${userId}\n🧾 TrxID: ${trxId}`;
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(tgMsg)}`);

        if (atResponse.ok) {
            checkStatus(recordId);
        }
    } catch (error) {
        statusText.innerText = "Error! আবার ট্রাই করুন।";
        submitBtn.disabled = false;
    }
}

function checkStatus(recordId) {
    const statusText = document.getElementById('status-text');
    const submitBtn = document.getElementById('submit-btn');
    
    // বাটন হাইড করে দেওয়া যাতে নতুন রিকোয়েস্ট না পাঠাতে পারে চেক চলাকালীন
    if(submitBtn) submitBtn.style.display = "none";

    const interval = setInterval(async () => {
        try {
            const checkUrl = `https://api.airtable.com/v0/${AT_BASE_ID}/${AT_TABLE_NAME}/${recordId}`;
            const response = await fetch(checkUrl, {
                headers: { 'Authorization': `Bearer ${AT_TOKEN}` }
            });
            const data = await response.json();
            const currentStatus = data.fields.Status;

            if (currentStatus === "Confirm") {
                statusText.innerHTML = "<span style='color:green'>✅ কনফার্ম হয়েছে!</span>";
                localStorage.removeItem('last_payment_id'); // কাজ শেষ, ডিলিট করে দিন
                clearInterval(interval);
                setTimeout(() => location.reload(), 5000); // ৫ সেকেন্ড পর ফ্রেশ পেজ
            } else if (currentStatus === "Reject") {
                statusText.innerHTML = "<span style='color:red'>❌ রিজেক্ট করা হয়েছে!</span>";
                localStorage.removeItem('last_payment_id');
                clearInterval(interval);
                setTimeout(() => location.reload(), 5000);
            } else {
                statusText.innerText = "অনুগ্রহ করে অপেক্ষা করুন চেক করছে...";
            }
        } catch (e) {
            console.log("Checking...");
        }
    }, 5000);
}
