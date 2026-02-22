/** 
 * main.js - Seedhe Maut Website Logic
 * Handles Cart State, UI Interactivity, and Animations
 */

// --- CART LOGIC ---
let cart = JSON.parse(localStorage.getItem('sm_cart')) || [];

function saveCart() {
    localStorage.setItem('sm_cart', JSON.stringify(cart));
    renderCart();
}

function addToCart(id, name, price, image) {
    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ id, name, price, image, quantity: 1 });
    }
    saveCart();
    showNotification(`${name} added to cart!`);
}
window.addToCart = addToCart;

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
}

function updateQuantity(id, delta) {
    const item = cart.find(item => item.id === id);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) removeFromCart(id);
        else saveCart();
    }
}

function renderCart() {
    const cartList = document.querySelector('.cart-items');
    const summaryTotal = document.querySelector('.summary-line.total span:last-child');
    const subtotalText = document.querySelector('.summary-line:first-child span:last-child');
    const checkoutItemsList = document.querySelector('#checkout-items-list');
    const checkoutTotal = document.querySelector('#checkout-total');

    if (!cartList && !checkoutItemsList) return;

    let total = 0;
    let html = '';

    cart.forEach(item => {
        total += item.price * item.quantity;
        html += `
            <div class="cart-item glass-card interactable reveal active">
                <img src="${item.image}" alt="${item.name}">
                <div class="item-details">
                    <h3>${item.name}</h3>
                    <div class="item-price">₹${(item.price * item.quantity).toLocaleString()}</div>
                </div>
                <div class="item-actions">
                    <div class="quantity-control">
                        <button class="interactable" onclick="updateQty('${item.id}', -1)">-</button>
                        <span>${item.quantity}</span>
                        <button class="interactable" onclick="updateQty('${item.id}', 1)">+</button>
                    </div>
                    <button class="remove-btn interactable" onclick="removeItem('${item.id}')"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `;
    });

    if (cartList) {
        cartList.innerHTML = html || '<div class="maut-font" style="font-size: 24px; opacity: 0.5;">Your cart is empty</div>';
        if (summaryTotal) summaryTotal.innerText = `₹${total.toLocaleString()}`;
        if (subtotalText) subtotalText.innerText = `₹${total.toLocaleString()}`;
    }

    if (checkoutItemsList) {
        let checkoutHtml = '';
        cart.forEach(item => {
            checkoutHtml += `<div class="summary-line"><span>${item.name} x${item.quantity}</span><span>₹${(item.price * item.quantity).toLocaleString()}</span></div>`;
        });
        checkoutItemsList.innerHTML = checkoutHtml;
        if (checkoutTotal) checkoutTotal.innerText = `₹${total.toLocaleString()}`;
    }

    // Refresh interactions for new elements
    initInteractions();
}

window.updateQty = updateQuantity;
window.removeItem = removeFromCart;

function bindCartButtons() {
    // Merch & SMFC Items
    const products = document.querySelectorAll('.merch-item, .merch-card, .showcase-item');
    products.forEach((item, index) => {
        const nameNode = item.querySelector('h3, h4');
        const priceNode = item.querySelector('p, .price');
        const imgNode = item.querySelector('img');

        if (!nameNode || !imgNode) return;

        const name = nameNode.innerText;
        const priceText = priceNode ? priceNode.innerText : "0";
        const price = parseInt(priceText.replace(/[^\d]/g, '')) || 0;
        const image = imgNode.src;

        // Standardize buttons or create if missing
        let btn = item.querySelector('.buy-btn, .add-to-cart, .cta-btn');
        if (btn) {
            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                addToCart(`product-${index}-${name.substring(0, 5)}`, name, price, image);
            };
        } else {
            const newBtn = document.createElement('button');
            newBtn.className = 'buy-btn interactable';
            newBtn.style.marginTop = '15px';
            newBtn.innerText = price === 0 ? 'Download Free' : 'Add to Cart';
            newBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                addToCart(`merch-${index}-${name.substring(0, 5)}`, name, price, image);
            };
            item.appendChild(newBtn);
        }
    });

    // Ticket Items
    document.querySelectorAll('.ticket-item').forEach((item, index) => {
        const cityNode = item.querySelector('h3');
        const dateNode = item.querySelector('p');
        const btn = item.querySelector('.buy-btn');

        if (!cityNode || !dateNode || !btn) return;

        const city = cityNode.innerText;
        const date = dateNode.innerText;
        const priceText = btn.innerText;
        const price = parseInt(priceText.replace(/[^\d]/g, '')) || 2499;
        const image = "Assets/Prmary Logos Black Red/Artboard 12SM logos.png";

        btn.onclick = (e) => {
            e.preventDefault();
            addToCart(`ticket-${index}-${city}`, `Ticket: ${city} (${date})`, price, image);
            window.location.href = 'cart.html';
        };
    });

    // Play Buttons Logic
    document.querySelectorAll('.play-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const parent = btn.closest('.album-card, .music-item, .showcase-item');
            const title = parent?.querySelector('h3, h4')?.innerText || "Unknown Track";
            const img = parent?.querySelector('img')?.src;

            const playerImg = document.querySelector('.player-info img');
            const playerTitle = document.querySelector('.player-info h4') || document.querySelector('.player-info h3');
            const playerIcon = document.querySelector('.play-pause i');

            if (playerImg) playerImg.src = img;
            if (playerTitle) playerTitle.innerText = title;
            if (playerIcon) {
                playerIcon.classList.remove('fa-play');
                playerIcon.classList.add('fa-pause');
            }
            showNotification(`Now Playing: ${title}`);
        };
    });
}


// --- INTERACTION ENGINE ---
function initInteractions() {
    const cursor = document.querySelector('.custom-cursor');
    const dot = document.querySelector('.cursor-dot');
    const glow = document.querySelector('.bg-glow');

    if (!window.mouseBound) {
        let mouseX = 0, mouseY = 0;
        let targetX = 0, targetY = 0;

        document.addEventListener('mousemove', (e) => {
            targetX = e.clientX;
            targetY = e.clientY;
        }, { passive: true });

        const updateVisuals = () => {
            // Smooth cursor interpolation
            mouseX += (targetX - mouseX) * 0.15;
            mouseY += (targetY - mouseY) * 0.15;

            if (cursor) {
                cursor.style.left = `${mouseX}px`;
                cursor.style.top = `${mouseY}px`;
            }
            if (dot) {
                dot.style.left = `${targetX}px`;
                dot.style.top = `${targetY}px`;
            }

            // Background Parallax
            if (glow) {
                const moveX = (window.innerWidth / 2 - targetX) / 50;
                const moveY = (window.innerHeight / 2 - targetY) / 50;
                glow.style.setProperty('--x', `${targetX}px`);
                glow.style.setProperty('--y', `${targetY}px`);
                glow.style.transform = `translate(${moveX}px, ${moveY}px)`;
            }

            // Magnetic Logic - Only if not on mobile
            if (window.innerWidth > 768) {
                document.querySelectorAll('.magnetic').forEach(btn => {
                    const rect = btn.getBoundingClientRect();
                    const btnX = rect.left + rect.width / 2;
                    const btnY = rect.top + rect.height / 2;
                    const dist = Math.hypot(targetX - btnX, targetY - btnY);

                    if (dist < 100) {
                        const pullX = (targetX - btnX) * 0.3;
                        const pullY = (targetY - btnY) * 0.3;
                        btn.style.transform = `translate(${pullX}px, ${pullY}px) scale(1.05)`;
                        cursor?.classList.add('magnetic-active');
                    } else {
                        btn.style.transform = '';
                        cursor?.classList.remove('magnetic-active');
                    }
                });
            }

            // Banner 3D Tilt
            const banner = document.querySelector('.tour-banner');
            if (banner && window.innerWidth > 768) {
                const rect = banner.getBoundingClientRect();
                const bX = rect.left + rect.width / 2;
                const bY = rect.top + rect.height / 2;
                const tiltX = (targetY - bY) / 40;
                const tiltY = -(targetX - bX) / 40;

                banner.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.02)`;
                const img = banner.querySelector('img');
                if (img) {
                    img.style.transform = `translate(${tiltY * 2}px, ${tiltX * 2}px) scale(1.1)`;
                }
            }

            requestAnimationFrame(updateVisuals);
        };
        requestAnimationFrame(updateVisuals);
        window.mouseBound = true;
    }

    const interactables = document.querySelectorAll('.interactable, a, button, .album-card, .music-item, .ticket-item, .cart-item, .merch-item, .merch-card, .showcase-item');
    interactables.forEach(el => {
        el.addEventListener('mouseenter', () => cursor?.classList.add('hover'));
        el.addEventListener('mouseleave', () => cursor?.classList.remove('hover'));
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('active');
                }, index * 100);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('section, .album-card, .music-item, .ticket-item, .cart-item, .merch-item, .merch-card, .scroll-reveal, .showcase-item, .reveal-clip').forEach(el => {
        el.classList.add('reveal');
        observer.observe(el);
    });

    // Glass Card Tilt - Throttled
    document.querySelectorAll('.glass-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            if (window.innerWidth < 768) return;
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const rotateX = (y - rect.height / 2) / 10;
            const rotateY = (rect.width / 2 - x) / 10;
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        }, { passive: true });
        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale(1)`;
        });
    });

    // Accordion Logic
    const accordionPanels = document.querySelectorAll('.accordion-panel');
    accordionPanels.forEach(panel => {
        panel.addEventListener('click', () => {
            accordionPanels.forEach(p => p.classList.remove('active'));
            panel.classList.add('active');
        });

        panel.addEventListener('mousemove', (e) => {
            if (window.innerWidth < 768) return;
            const rect = panel.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (centerY - y) / 15;
            const rotateY = (x - centerX) / 25;

            panel.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        }, { passive: true });

        panel.addEventListener('mouseleave', () => {
            panel.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale(1)`;
        });
    });

    // Music Player Filter Logic
    const filterTabs = document.querySelectorAll('.filter-tabs li');
    const musicItems = document.querySelectorAll('.music-item');

    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const filter = tab.getAttribute('data-filter');
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            musicItems.forEach(item => {
                if (item.getAttribute('data-category') === filter || filter === 'all') {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        });
    });

    bindGeneralEvents();
}

function bindGeneralEvents() {
    const header = document.querySelector('#header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) header?.classList.add('scrolled');
        else header?.classList.remove('scrolled');
    }, { passive: true });

    const burgerMenu = document.querySelector('.burger-menu-overlay');
    const menuTrigger = document.querySelector('.menu-trigger');
    const closeBurger = document.querySelector('.close-menu');

    if (menuTrigger) menuTrigger.onclick = () => { burgerMenu?.classList.add('active'); document.body.style.overflow = 'hidden'; };
    if (closeBurger) closeBurger.onclick = () => { burgerMenu?.classList.remove('active'); document.body.style.overflow = 'auto'; };

    const loginTriggers = document.querySelectorAll('.login-trigger');
    const authModal = document.querySelector('#auth-modal');
    const closeModals = document.querySelectorAll('.close-modal');

    loginTriggers.forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault();
            authModal?.classList.add('active');
            document.body.style.overflow = 'hidden';
        };
    });

    closeModals.forEach(btn => {
        btn.onclick = () => {
            authModal?.classList.remove('active');
            document.body.style.overflow = 'auto';
        };
    });

    window.onclick = (event) => {
        if (event.target == authModal) {
            authModal?.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    };

    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) checkoutBtn.onclick = () => { window.location.href = 'checkout.html'; };

    document.querySelectorAll('.payment-card').forEach(card => {
        card.onclick = () => {
            document.querySelectorAll('.payment-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
        };
    });

    // Search Focus Logic
    const searchTrigger = document.querySelector('.focus-search');
    const searchInput = document.querySelector('.search-container input');
    if (searchTrigger && searchInput) {
        searchTrigger.onclick = () => {
            searchInput.focus();
            searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        };
    }

    // Music Player Controls
    const playPauseBtn = document.querySelector('.play-pause');
    if (playPauseBtn) {
        playPauseBtn.onclick = () => {
            const icon = playPauseBtn.querySelector('i');
            if (icon.classList.contains('fa-play')) {
                icon.classList.replace('fa-play', 'fa-pause');
                showNotification("Playing...");
            } else {
                icon.classList.replace('fa-pause', 'fa-play');
                showNotification("Paused");
            }
        };
    }

    // Auth Buttons Feedback
    document.querySelectorAll('.auth-btn').forEach(btn => {
        btn.onclick = () => {
            const provider = btn.querySelector('span')?.innerText || "Account";
            showNotification(`Connecting to ${provider}...`);
            setTimeout(() => {
                showNotification(`${provider} Connected successfully!`);
            }, 1000);
        };
    });

    // Order Completion
    const orderBtn = document.querySelector('.complete-order, .checkout-btn');
    if (orderBtn && window.location.pathname.includes('checkout')) {
        orderBtn.onclick = () => {
            showNotification("Encrypting order...");
            setTimeout(() => {
                showNotification("Vault Transaction Successful!");
                cart = [];
                saveCart();
                setTimeout(() => window.location.href = 'index.html', 2000);
            }, 1200);
        };
    }
}

// --- NOTIFICATION SYSTEM ---
function showNotification(message) {
    let container = document.querySelector('.notification-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.innerHTML = `
        <i class="fa-solid fa-circle-check" style="color: #ff0000; margin-right: 12px;"></i>
        <span>${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('active');
        setTimeout(() => {
            toast.classList.remove('active');
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }, 100);
}

// --- PRELOADER LOGIC ---
let isPreloaderActive = false;
function initPreloader() {
    if (isPreloaderActive || window.preloaderInitialized) return;

    const preloader = document.getElementById('preloader');
    const fill = document.querySelector('.loader-progress-fill');

    if (!preloader || !fill) return;

    isPreloaderActive = true;
    document.body.style.overflow = 'hidden';

    // Spawn random blood drips
    const spawnDrip = () => {
        const preloader = document.getElementById('preloader');
        if (!preloader || preloader.classList.contains('loaded')) return;
        const drip = document.createElement('div');
        drip.className = 'blood-drip';
        drip.style.left = Math.random() * 98 + 'vw';
        drip.style.animationDuration = (Math.random() * 2 + 1) + 's';
        drip.style.opacity = Math.random();
        preloader.appendChild(drip);
        setTimeout(() => drip.remove(), 4000);
        setTimeout(spawnDrip, Math.random() * 300);
    };
    spawnDrip();

    let progress = 0;
    const interval = setInterval(() => {
        const fill = document.querySelector('.loader-progress-fill');
        if (!fill) {
            clearInterval(interval);
            return;
        }
        progress += Math.random() * 8;
        if (progress >= 95) {
            progress = 95;
            clearInterval(interval);
        }
        fill.style.width = `${progress}%`;
    }, 100);

    const finishLoading = () => {
        if (!isPreloaderActive) return;
        clearInterval(interval);
        const fill = document.querySelector('.loader-progress-fill');
        const preloader = document.getElementById('preloader');
        if (fill) fill.style.width = '100%';

        setTimeout(() => {
            if (preloader) preloader.classList.add('loaded');
            document.body.style.overflow = 'auto';
            window.preloaderInitialized = true;
            isPreloaderActive = false;
            document.querySelectorAll('.reveal-clip, .reveal-up').forEach(el => el.classList.add('active'));
        }, 800);
    };

    // Robust loading check
    if (document.readyState === 'complete') {
        setTimeout(finishLoading, 500);
    } else {
        window.addEventListener('load', finishLoading);
        // Fallback for slow assets
        setTimeout(finishLoading, 5000);
    }
}

// --- AI ASSISTANT LOGIC ---
function initAIAssistant() {
    if (document.querySelector('.ai-assistant-container')) return;

    const container = document.createElement('div');
    container.className = 'ai-assistant-container';
    container.innerHTML = `
        <div class="ai-chat-window" id="aiChatWindow">
            <div class="ai-chat-header">
                <div class="ai-avatar"><i class="fa-solid fa-robot"></i></div>
                <div class="ai-info">
                    <h3>MAUT AI</h3>
                    <span>Vault Assistant</span>
                </div>
            </div>
            <div class="ai-chat-messages" id="aiMessages">
                <div class="message ai">Gully mein swagat hai! I'm your Maut AI assistant. How can I help you navigate the vault today?</div>
            </div>
            <form class="ai-chat-input" id="aiChatForm">
                <input type="text" placeholder="Type your message..." id="aiInput" autocomplete="off">
                <button type="submit" class="send-msg interactable"><i class="fa-solid fa-paper-plane"></i></button>
            </form>
        </div>
        <div class="ai-chat-bubble interactable" id="aiBubble">
            <i class="fa-solid fa-comment-dots"></i>
        </div>
    `;
    document.body.appendChild(container);

    const bubble = document.getElementById('aiBubble');
    const chatWindow = document.getElementById('aiChatWindow');
    const form = document.getElementById('aiChatForm');
    const input = document.getElementById('aiInput');
    const messages = document.getElementById('aiMessages');

    if (bubble) bubble.onclick = () => chatWindow.classList.toggle('active');

    const addMessage = (text, type) => {
        const msg = document.createElement('div');
        msg.className = `message ${type}`;
        msg.innerText = text;
        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;
    };

    const getResponse = (query) => {
        query = query.toLowerCase();
        if (query.includes('tour') || query.includes('show') || query.includes('concert')) return "The SMX World Tour is currently hitting cities globally! Check the Tour section for dates in London, New York, and Singapore.";
        if (query.includes('cart') || query.includes('buy') || query.includes('order')) return "You can add merch or tickets to your cart directly from the Maal or Tour pages. Ready to checkout?";
        if (query.includes('merch') || query.includes('tshirt') || query.includes('shirt')) return "Our Core collection features the Daily Essential Tee and limited edition drops. Check the 'Maal' section!";
        if (query.includes('hello') || query.includes('hi')) return "Kya haal hai! Ready to dive into the world of Seedhe Maut?";
        return "I'm still learning the way of the Gully, but I can help you with Tour dates, Merch info, and Cart issues!";
    };

    if (form) form.onsubmit = (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;

        addMessage(text, 'user');
        input.value = '';

        setTimeout(() => {
            const response = getResponse(text);
            addMessage(response, 'ai');
        }, 600);
    };

    // Initialize interactions for the new elements
    const cursor = document.querySelector('.custom-cursor');
    container.querySelectorAll('.interactable').forEach(el => {
        el.addEventListener('mouseenter', () => cursor?.classList.add('hover'));
        el.addEventListener('mouseleave', () => cursor?.classList.remove('hover'));
    });
}

// --- INITIALIZATION ---
function init() {
    initPreloader();
    initInteractions();
    bindCartButtons();
    renderCart();
    initAIAssistant();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export for sub-pages
window.loadSpecificSections = async function (sectionList) {
    const mainContent = document.querySelector('#main-content');
    if (!mainContent) return;

    try {
        mainContent.innerHTML = '';
        for (const section of sectionList) {
            const response = await fetch(`./sections/${section}.html`);
            if (response.ok) {
                const html = await response.text();
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                mainContent.appendChild(tempDiv.firstElementChild);
            }
        }
        initInteractions();
        bindCartButtons();
    } catch (error) {
        console.error('Error loading modular sections:', error);
    }
};
