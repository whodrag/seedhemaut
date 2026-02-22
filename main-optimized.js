/** 
 * Optimized main.js - Seedhe Maut Website
 * Performance optimized with lazy loading and mobile-first approach
 */

// --- CART LOGIC ---
let cart = JSON.parse(localStorage.getItem('sm_cart')) || [];

function saveCart() {
    localStorage.setItem('sm_cart', JSON.stringify(cart));
    renderCart();
}

// Debounced function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttled function for scroll events
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Optimized cart functions
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
                <img src="${item.image}" alt="${item.name}" loading="lazy">
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
    document.querySelectorAll('.merch-item').forEach((item, index) => {
        const name = item.querySelector('h4').innerText;
        const priceText = item.querySelector('p').innerText;
        const price = parseInt(priceText.replace(/[^\d]/g, ''));
        const image = item.querySelector('img').src;
        const id = `merch-${index}`;

        const btn = document.createElement('button');
        btn.className = 'add-to-cart-btn magnetic interactable';
        btn.innerHTML = '<i class="fa-solid fa-cart-plus"></i> Add to Cart';
        btn.onclick = () => addToCart(id, name, price, image);
        
        item.appendChild(btn);
    });
}

// --- NOTIFICATION SYSTEM ---
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'var(--primary-red)' : '#ff4444'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// --- INTERACTIONS ---
function initInteractions() {
    // Magnetic buttons effect (disabled on mobile for performance)
    if (window.innerWidth > 768) {
        document.querySelectorAll('.magnetic').forEach(elem => {
            elem.addEventListener('mousemove', throttle(function(e) {
                const rect = elem.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                
                elem.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
            }, 16));
            
            elem.addEventListener('mouseleave', function() {
                elem.style.transform = 'translate(0, 0)';
            });
        });
    }

    // Interactive elements hover effect
    document.querySelectorAll('.interactable').forEach(elem => {
        elem.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
        });
        
        elem.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });
}

// --- LAZY LOADING ---
function initLazyLoading() {
    const images = document.querySelectorAll('img[loading="lazy"]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src || img.src;
                    img.classList.add('loaded');
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });
        
        images.forEach(img => imageObserver.observe(img));
    } else {
        // Fallback for older browsers
        images.forEach(img => {
            img.src = img.dataset.src || img.src;
            img.classList.add('loaded');
        });
    }
}

// --- ANIMATIONS ---
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach(elem => {
        observer.observe(elem);
    });
}

// --- MODAL HANDLING ---
function initModals() {
    const authModal = document.getElementById('auth-modal');
    const loginTriggers = document.querySelectorAll('.login-trigger');
    const closeModal = document.querySelector('.close-modal');
    
    loginTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            authModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        });
    });
    
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            authModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    }
    
    authModal.addEventListener('click', (e) => {
        if (e.target === authModal) {
            authModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
}

// --- BURGER MENU ---
function initBurgerMenu() {
    const menuTrigger = document.querySelector('.menu-trigger');
    const burgerOverlay = document.querySelector('.burger-menu-overlay');
    const closeMenu = document.querySelector('.close-menu');
    
    if (!menuTrigger || !burgerOverlay) return;
    
    menuTrigger.addEventListener('click', () => {
        burgerOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    });
    
    closeMenu.addEventListener('click', () => {
        burgerOverlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    });
    
    burgerOverlay.addEventListener('click', (e) => {
        if (e.target === burgerOverlay) {
            burgerOverlay.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
}

// --- SEARCH FUNCTIONALITY ---
function initSearch() {
    const searchInput = document.querySelector('.search-container input');
    if (!searchInput) return;
    
    const performSearch = debounce((query) => {
        console.log('Searching for:', query);
        // Implement search functionality here
        if (query.length > 2) {
            // Show search results
            showNotification(`Searching for "${query}"...`);
        }
    }, 300);
    
    searchInput.addEventListener('input', (e) => {
        performSearch(e.target.value);
    });
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = e.target.value.trim();
            if (query) {
                performSearch(query);
            }
        }
    });
}

// --- MUSIC PLAYER ---
function initMusicPlayer() {
    const playBtn = document.querySelector('.play-pause');
    const prevBtn = document.querySelector('.player-controls button:first-child');
    const nextBtn = document.querySelector('.player-controls button:last-child');
    
    if (!playBtn) return;
    
    let isPlaying = false;
    
    playBtn.addEventListener('click', () => {
        isPlaying = !isPlaying;
        const icon = playBtn.querySelector('i');
        icon.className = isPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play';
        
        if (isPlaying) {
            showNotification('Playing track...');
        } else {
            showNotification('Paused');
        }
    });
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            showNotification('Previous track');
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            showNotification('Next track');
        });
    }
}

// --- PRELOADER ---
function initPreloader() {
    const preloader = document.getElementById('preloader');
    if (!preloader) return;
    
    const hidePreloader = () => {
        setTimeout(() => {
            preloader.classList.add('loaded');
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 500);
        }, 1000);
    };

    if (document.readyState === 'complete') {
        hidePreloader();
    } else {
        window.addEventListener('load', hidePreloader);
    }
}

// --- PERFORMANCE MONITORING ---
function initPerformanceMonitoring() {
    // Log performance metrics
    if ('performance' in window) {
        window.addEventListener('load', () => {
            const perfData = performance.getEntriesByType('navigation')[0];
            const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
            console.log(`Page load time: ${loadTime}ms`);
            
            // Log if load time is too slow
            if (loadTime > 3000) {
                console.warn('Slow page load detected');
            }
        });
    }
}

// --- AUTHENTICATION ---
function initAuth() {
    const discordBtn = document.querySelector('.discord-btn');
    const googleBtn = document.querySelector('.google-btn');
    const spotifyBtn = document.querySelector('.spotify-btn');
    
    if (discordBtn) {
        discordBtn.addEventListener('click', () => {
            showNotification('Connecting to Discord...');
            // Implement Discord OAuth here
        });
    }
    
    if (googleBtn) {
        googleBtn.addEventListener('click', () => {
            showNotification('Connecting to Google...');
            // Implement Google OAuth here
        });
    }
    
    if (spotifyBtn) {
        spotifyBtn.addEventListener('click', () => {
            showNotification('Connecting to Spotify...');
            // Implement Spotify OAuth here
        });
    }
}

// --- TAB FUNCTIONALITY ---
function initTabs() {
    const tabs = document.querySelectorAll('.filter-tabs li');
    if (!tabs.length) return;
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            tab.classList.add('active');
            
            const filterType = tab.textContent.trim();
            showNotification(`Filter: ${filterType}`);
            // Implement filtering logic here
        });
    });
}

// --- ACCORDION FUNCTIONALITY ---
function initAccordion() {
    const panels = document.querySelectorAll('.accordion-panel');
    if (!panels.length) return;
    
    panels.forEach(panel => {
        panel.addEventListener('click', () => {
            const isActive = panel.classList.contains('active');
            
            // Close all panels
            panels.forEach(p => p.classList.remove('active'));
            
            // Open clicked panel if it wasn't active
            if (!isActive) {
                panel.classList.add('active');
            }
        });
    });
}

// --- MAIN INITIALIZATION ---
function init() {
    // Initialize all modules
    initPreloader();
    initLazyLoading();
    initInteractions();
    initModals();
    initBurgerMenu();
    initSearch();
    initMusicPlayer();
    initAuth();
    initTabs();
    initAccordion();
    initScrollAnimations();
    initPerformanceMonitoring();
    
    // Initialize cart if on merch page
    if (document.querySelector('.merch-item')) {
        bindCartButtons();
    }
    
    // Initialize cart display if on cart page
    if (document.querySelector('.cart-items') || document.querySelector('#checkout-items-list')) {
        renderCart();
    }
    
    console.log('Seedhe Maut website initialized successfully');
}

// --- DOM READY ---
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// --- ERROR HANDLING ---
window.addEventListener('error', (e) => {
    console.error('JavaScript error:', e.error);
    showNotification('Something went wrong. Please refresh the page.', 'error');
});

// --- SERVICE WORKER FOR PWA (Optional) ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Uncomment to enable PWA
        // navigator.serviceWorker.register('/sw.js')
        //     .then(registration => console.log('SW registered'))
        //     .catch(err => console.log('SW registration failed'));
    });
}

// Export for global access
window.showNotification = showNotification;
window.addToCart = addToCart;
