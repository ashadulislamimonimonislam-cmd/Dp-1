const BOT_TOKEN = '8804333424:AAFKquGlqxwYIsverAqf4XQFhTGipTX6acI';
const CHAT_ID = '6472310925';
const AT_TOKEN = 'patzXdNIbu5pFhUFY.6586827607f7dcaf7830c872e03f599acfc7f392c891693efd9cf73b7fbe5441';
const AT_BASE_ID = 'appEiZDN5IcHoGjSe';
const AT_TABLE_NAME = 'Table 1';

// সেকশন সুইচ করার ফাংশন
function showSection(type) {
    if (type === 'deposit') {
        document.getElementById('deposit-section').classList.remove('hidden');
        document.getElementById('withdraw-section').classList.add('hidden');
    } else {
        document.getElementById('withdraw-section').classList.remove('hidden');
        document.getElementById('deposit-section').classList.add('hidden');
    }
}

window.onload = function() {
    const savedId = localStorage.getItem('last_payment_id');
    const type = localStorage.getItem('request_type');
    
    if (savedId) {
        if(type === 'withdraw') {
            showSection('withdraw');
            checkStatus(savedId, 'w-status-text', 'withdraw-submit-btn', true);
        } else {
            showSection('deposit');
            document.getElementById('deposit-form').classList.remove('hidden');
            checkStatus(savedId, 'status-text', 'submit-btn', false);
        }
    }
};

// উইথড্র ফাংশন
async function processWithdraw() {
    const userId = document.getElementById('w-user-id').value;
    const amount = document.getElementById('w-last-num').value;
    const statusText = document.getElementById('w-status-text');
    const submitBtn = document.getElementById('withdraw-submit-btn');

    if (!userId || !amount) { alert("সব তথ্য দিন!"); return; }

    submitBtn.disabled = true;
    document.getElementById('w-admin-response').style.display = "block";
    statusText.innerText = "রিকোয়েস্ট পাঠানো হচ্ছে...";

    try {
        const atData = { fields: { "Name": userId, "Method": "Withdraw", "TrxID": amount, "Status": "Pending" } };
        const response = await fetch(`https://api.airtable.com/v0/${AT_BASE_ID}/${AT_TABLE_NAME}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${AT_TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(atData)
        });
        const result = await response.json();
        
        localStorage.setItem('last_payment_id', result.id);
        localStorage.setItem('request_type', 'withdraw');

        const tgMsg = `⚠️ উইথড্র রিকোয়েস্ট!\n🆔 আইডি: ${userId}\n💰 পরিমাণ: ${amount}`;
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(tgMsg)}`);

        checkStatus(result.id, 'w-status-text', 'withdraw-submit-btn', true);
    } catch (e) { alert("ভুল হয়েছে!"); submitBtn.disabled = false; }
}

// কমন স্ট্যাটাস চেকার
function checkStatus(recordId, statusElementId, btnId, isWithdraw) {
    const statusText = document.getElementById(statusElementId);
    const submitBtn = document.getElementById(btnId);
    if(submitBtn) submitBtn.style.display = "none";
    if(isWithdraw) document.getElementById('w-admin-response').style.display = "block";

    const interval = setInterval(async () => {
        try {
            const res = await fetch(`https://api.airtable.com/v0/${AT_BASE_ID}/${AT_TABLE_NAME}/${recordId}`, {
                headers: { 'Authorization': `Bearer ${AT_TOKEN}` }
            });
            const data = await res.json();
            const currentStatus = data.fields.Status;
            const adminNote = data.fields.Method; // আপনি যদি Method কলামে নাম্বার লিখে দেন

            if (currentStatus === "Confirm") {
                clearInterval(interval);
                if(isWithdraw) {
                    statusText.innerHTML = "✅ কনফার্ম! আপনার টাকা পাঠানোর নাম্বার নিচে দেখুন:";
                    document.getElementById('admin-number-display').innerText = adminNote; 
                    // উইথড্র কনফার্ম হলে ইউজারকে একটু সময় দিন নাম্বারটি দেখার জন্য
                    setTimeout(() => { localStorage.clear(); location.reload(); }, 15000);
                } else {
                    localStorage.clear();
                    window.location.href = "success.html";
                }
            } else if (currentStatus === "Reject") {
                clearInterval(interval);
                localStorage.clear();
                statusText.innerHTML = "<span style='color:red'>❌ রিজেক্ট করা হয়েছে।</span>";
                setTimeout(() => location.reload(), 4000);
            } else {
                statusText.innerText = "অ্যাডমিন চেক করছে... অপেক্ষা করুন।";
            }
        } catch (e) { console.log("Wait..."); }
    }, 5000);
}
