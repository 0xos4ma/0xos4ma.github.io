// Blog page JavaScript functionality

let allPosts = [];
let filteredPosts = [];

// Initialize blog page
document.addEventListener('DOMContentLoaded', function() {
    initializeBlogPage();
});

async function initializeBlogPage() {
    await loadBlogPosts();
    initializeSearch();
    initializeCategoryFilters();
}

// Load all blog posts
async function loadBlogPosts() {
    const postsContainer = document.getElementById('blog-posts');
    const noPostsMessage = document.getElementById('no-posts');
    
    if (!postsContainer) return;

    try {
        const response = await fetch('data/posts.json');
        allPosts = await response.json();
        filteredPosts = [...allPosts];
        
        displayPosts(filteredPosts);
        
    } catch (error) {
        console.error('Error loading blog posts:', error);
        postsContainer.innerHTML = '<p>Unable to load posts at this time.</p>';
    }
}

// Display posts in the grid
function displayPosts(posts) {
    const postsContainer = document.getElementById('blog-posts');
    const noPostsMessage = document.getElementById('no-posts');
    
    if (!postsContainer) return;

    if (posts.length === 0) {
        postsContainer.style.display = 'none';
        noPostsMessage.style.display = 'block';
        return;
    }

    postsContainer.style.display = 'grid';
    noPostsMessage.style.display = 'none';
    
    postsContainer.innerHTML = posts.map(post => createBlogPostCard(post)).join('');
    
    // Add click event listeners to post cards
    const postCards = postsContainer.querySelectorAll('.post-card');
    postCards.forEach((card, index) => {
        card.addEventListener('click', function() {
            window.location.href = `post.html?id=${posts[index].id}`;
        });
    });
}

// Create blog post card HTML
function createBlogPostCard(post) {
    const categories = post.categories.map(cat => 
        `<span class="category-tag">${cat}</span>`
    ).join('');
    
    return `
        <div class="post-card">
            <div class="post-image">
                <!-- <i class="fas fa-shield-alt"></i> -->
                <img src="${post.image}" alt="${post.title}">
            </div>
            <div class="post-content">
                <div class="post-meta">
                    <span class="post-date">${window.CyberSecUtils.formatDate(post.date)}</span>
                    <div class="post-categories">${categories}</div>
                </div>
                <h3 class="post-title">${post.title}</h3>
                <p class="post-excerpt">${post.excerpt}</p>
            </div>
        </div>
    `;
}

// Initialize search functionality
function initializeSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) {
        console.error('Search input element not found');
        return;
    }

    const debouncedSearch = window.CyberSecUtils.debounce(performSearch, 300);
    
    searchInput.addEventListener('input', function() {
        console.log('Search input changed:', this.value);
        debouncedSearch(this.value);
    });
    
    console.log('Search functionality initialized');
}

// Perform search
function performSearch(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    console.log('Performing search for:', term);
    
    // Get current category filter
    const activeCategory = document.querySelector('.filter-btn.active');
    const currentCategory = activeCategory ? activeCategory.getAttribute('data-category') : 'all';
    console.log('Current category:', currentCategory);
    
    // First filter by category
    let postsToSearch = allPosts;
    if (currentCategory !== 'all') {
        postsToSearch = allPosts.filter(post => 
            post.categories.some(cat => 
                cat.toLowerCase().replace(/\s+/g, '-') === currentCategory
            )
        );
    }
    console.log('Posts to search in:', postsToSearch.length);
    
    // Then apply search filter
    if (term === '') {
        filteredPosts = [...postsToSearch];
    } else {
        filteredPosts = postsToSearch.filter(post => 
            post.title.toLowerCase().includes(term) ||
            post.excerpt.toLowerCase().includes(term) ||
            post.categories.some(cat => cat.toLowerCase().includes(term)) ||
            (post.tags && post.tags.some(tag => tag.toLowerCase().includes(term)))
        );
    }
    
    console.log('Filtered posts:', filteredPosts.length);
    displayPosts(filteredPosts);
}

// Initialize category filters
function initializeCategoryFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    if (!filterButtons.length) return;

    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Filter posts by category
            const category = this.getAttribute('data-category');
            filterPostsByCategory(category);
        });
    });
}

// Filter posts by category
function filterPostsByCategory(category) {
    if (category === 'all') {
        filteredPosts = [...allPosts];
    } else {
        filteredPosts = allPosts.filter(post => 
            post.categories.some(cat => 
                cat.toLowerCase().replace(/\s+/g, '-') === category
            )
        );
    }
    
    // Apply current search term if any
    const searchInput = document.getElementById('search-input');
    if (searchInput && searchInput.value.trim()) {
        performSearch(searchInput.value);
    } else {
        displayPosts(filteredPosts);
    }
}

// Get all unique categories from posts
function getAllCategories(posts) {
    const categories = new Set();
    posts.forEach(post => {
        post.categories.forEach(category => {
            categories.add(category);
        });
    });
    return Array.from(categories);
}

// Create category filter buttons dynamically
function createCategoryFilters(posts) {
    const categories = getAllCategories(posts);
    const filterContainer = document.querySelector('.filter-buttons');
    
    if (!filterContainer) return;

    // Clear existing filter buttons (except "All")
    const allButton = filterContainer.querySelector('[data-category="all"]');
    filterContainer.innerHTML = '';
    if (allButton) {
        filterContainer.appendChild(allButton);
    }

    // Add category buttons
    categories.forEach(category => {
        const button = document.createElement('button');
        button.className = 'filter-btn';
        button.setAttribute('data-category', category.toLowerCase().replace(/\s+/g, '-'));
        button.textContent = category;
        filterContainer.appendChild(button);
    });

    // Re-initialize event listeners
    initializeCategoryFilters();
}


// Export functions for use in other files
window.BlogUtils = {
    loadBlogPosts,
    displayPosts,
    performSearch,
    filterPostsByCategory,
    getAllCategories,
    createCategoryFilters
};
