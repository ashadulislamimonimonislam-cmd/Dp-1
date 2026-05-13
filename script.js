const BOT_TOKEN = '8804333424:AAFKquGlqxwYIsverAqf4XQFhTGipTX6acI';
const CHAT_ID = '6472310925';
const AT_TOKEN = 'patzXdNIbu5pFhUFY.6586827607f7dcaf7830c872e03f599acfc7f392c891693efd9cf73b7fbe5441';
const AT_BASE_ID = 'appEiZDN5IcHoGjSe';
const AT_TABLE_NAME = 'Table 1';

window.onload = function() {
    const savedId = localStorage.getItem('last_payment_id');
    if (savedId) {
        // যদি আগে থেকেই কোনো ডিপোজিট বা উইথড্র পেন্ডিং থাকে
        const type = localStorage.getItem('request_type');
        if(type === 'withdraw') {
            document.getElementById('withdraw-form').classList.remove('hidden');
            checkStatus(savedId, 'w-status-text', 'withdraw-submit-btn');
        } else {
            document.getElementById('deposit-form').classList.remove('hidden');
            checkStatus(savedId, 'status-text', 'submit-btn');
        }
    }
};

function openWithdrawForm() {
    document.getElementById('deposit-form').classList.add('hidden');
    document.getElementById('withdraw-form').classList.remove('hidden');
}

// উইথড্র প্রসেস করার ফাংশন
async function processWithdraw() {
    const userId = document.getElementById('w-user-id').value;
    const lastNum = document.getElementById('w-last-num').value;
    const statusText = document.getElementById('w-status-text');
    const submitBtn = document.getElementById('withdraw-submit-btn');

    if (!userId || !lastNum) {
        alert("সবগুলো তথ্য দিন!"); return;
    }

    submitBtn.disabled = true;
    statusText.style.display = "block";
    statusText.innerText = "উইথড্র রিকোয়েস্ট পাঠানো হচ্ছে...";

    try {
        const atData = {
            fields: {
                "Name": userId,
                "Method": "Withdraw",
                "TrxID": lastNum,
                "Status": "Pending"
            }
        };

        const response = await fetch(`https://api.airtable.com/v0/${AT_BASE_ID}/${AT_TABLE_NAME}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${AT_TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(atData)
        });

        const result = await response.json();
        localStorage.setItem('last_payment_id', result.id);
        localStorage.setItem('request_type', 'withdraw');

        const tgMsg = `⚠️ নতুন উইথড্র রিকোয়েস্ট!\n🆔 আইডি: ${userId}\n🔢 কোড/নাম্বার: ${lastNum}`;
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(tgMsg)}`);

        checkStatus(result.id, 'w-status-text', 'withdraw-submit-btn');
    } catch (e) {
        alert("সমস্যা হয়েছে!");
        submitBtn.disabled = false;
    }
}

// কমন স্ট্যাটাস চেকার
function checkStatus(recordId, statusElementId, btnId) {
    const statusText = document.getElementById(statusElementId);
    const submitBtn = document.getElementById(btnId);
    if(submitBtn) submitBtn.style.display = "none";
    statusText.style.display = "block";

    const interval = setInterval(async () => {
        try {
            const res = await fetch(`https://api.airtable.com/v0/${AT_BASE_ID}/${AT_TABLE_NAME}/${recordId}`, {
                headers: { 'Authorization': `Bearer ${AT_TOKEN}` }
            });
            const data = await res.json();
            const currentStatus = data.fields.Status;

            if (currentStatus === "Confirm") {
                clearInterval(interval);
                localStorage.clear();
                // নতুন পেজ ওপেন হবে
                window.location.href = "success.html"; 
            } else if (currentStatus === "Reject") {
                clearInterval(interval);
                localStorage.clear();
                statusText.innerHTML = "<span style='color:red'>❌ আপনার রিকোয়েস্ট রিজেক্ট করা হয়েছে।</span>";
                setTimeout(() => location.reload(), 4000);
            } else {
                statusText.innerText = "অ্যাডমিন ভেরিফাই করছে... অপেক্ষা করুন।";
            }
        } catch (e) { console.log("Checking..."); }
    }, 5000);
}
