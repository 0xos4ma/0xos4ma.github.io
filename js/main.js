// Main JavaScript file for the cybersecurity portfolio website

// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeSmoothScrolling();
    loadLatestPostsGrid();
    initializeAnimations();
    setCanonicalLink();
});

// Navigation functionality
function initializeNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Mobile menu toggle
    if (navToggle) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        });
    });

    // Active link highlighting
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(10, 10, 10, 0.98)';
        } else {
            navbar.style.background = 'rgba(10, 10, 10, 0.95)';
        }
    });
}

// Smooth scrolling for anchor links
function initializeSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const offsetTop = targetElement.offsetTop - 70; // Account for fixed navbar
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Load latest three posts into homepage grid
async function loadLatestPostsGrid() {
    const latestContainer = document.getElementById('latest-posts');
    if (!latestContainer) return;

    try {
        const response = await fetch('data/posts.json');
        const posts = await response.json();
        const latestThree = posts.slice(0, 3);

        latestContainer.innerHTML = latestThree.map(post => createPostCard(post)).join('');

        const postCards = latestContainer.querySelectorAll('.post-card');
        postCards.forEach((card, index) => {
            card.addEventListener('click', function() {
                window.location.href = `post.html?id=${latestThree[index].id}`;
            });
        });
    } catch (error) {
        console.error('Error loading latest posts:', error);
        latestContainer.innerHTML = '<p>Unable to load posts at this time.</p>';
    }
}

// Create post card HTML
function createPostCard(post) {
    const categories = post.categories.map(cat => 
        `<span class="category-tag">${cat}</span>`
    ).join('');
    
    return `
        <div class="post-card">
            <div class="post-image">
                ${post.image ? `<img src="${post.image}" alt="${post.title}" loading="lazy">` : `<i class="fas fa-shield-alt"></i>`}
            </div>
            <div class="post-content">
                <div class="post-meta">
                    <span class="post-date">${formatDate(post.date)}</span>
                    <div class="post-categories">${categories}</div>
                </div>
                <h3 class="post-title">${post.title}</h3>
                <p class="post-excerpt">${post.excerpt}</p>
            </div>
        </div>
    `;
}

// Remove cover/card builder since we now use the standard post cards in a grid

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Initialize animations
function initializeAnimations() {
    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animateElements = document.querySelectorAll('.skill-card, .post-card, .service-card, .cert-item, .link-card');
    animateElements.forEach(el => observer.observe(el));

    // Terminal typing animation
    const typingElement = document.querySelector('.typing');
    if (typingElement) {
        const text = typingElement.textContent;
        typingElement.textContent = '';
        let i = 0;
        
        function typeWriter() {
            if (i < text.length) {
                typingElement.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 100);
            } else {
                setTimeout(() => {
                    typingElement.textContent = '';
                    i = 0;
                    typeWriter();
                }, 2000);
            }
        }
        
        setTimeout(typeWriter, 1000);
    }
}

// Utility function to debounce function calls
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

// Utility function to throttle function calls
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
    };
}

// Error handling for fetch requests
async function safeFetch(url, options = {}) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        return null;
    }
}

// Set canonical link to current URL
function setCanonicalLink() {
    const link = document.getElementById('canonical-link');
    if (link) {
        link.setAttribute('href', window.location.href);
    }
}

// Export functions for use in other files
window.CyberSecUtils = {
    createPostCard,
    formatDate,
    debounce,
    throttle,
    safeFetch
};
