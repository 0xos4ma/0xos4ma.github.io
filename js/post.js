// Blog post page JavaScript functionality

let currentPost = null;
let allPosts = [];

document.addEventListener('DOMContentLoaded', function() {
    initializePostPage();
});

async function initializePostPage() {
    const postId = getPostIdFromUrl();
    if (!postId) {
        showError('Post not found');
        return;
    }

    await loadPostData();
    await loadPostContent(postId);
    initializePostShareButtons();
}

function getPostIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

async function loadPostData() {
    try {
        const response = await fetch('data/posts.json');
        allPosts = await response.json();
    } catch (error) {
        console.error('Error loading post data:', error);
        showError('Unable to load post data');
    }
}

async function loadPostContent(postId) {
    try {
        // Find the post in the data
        currentPost = allPosts.find(post => post.id === postId);
        
        if (!currentPost) {
            showError('Post not found');
            return;
        }

        // Update page title and meta
        injectDynamicSeo(currentPost);
        
        // Update breadcrumb
        document.getElementById('post-title-breadcrumb').textContent = currentPost.title;

        // Set canonical and og:url
        const canonical = document.getElementById('canonical-link');
        if (canonical) canonical.setAttribute('href', window.location.href);
        const ogUrl = document.querySelector('meta[property="og:url"]');
        if (ogUrl) ogUrl.setAttribute('content', window.location.href);
        
        // Update post header
        document.getElementById('post-title').textContent = currentPost.title;
        document.getElementById('post-date').textContent = window.CyberSecUtils.formatDate(currentPost.date);
        
        // Update categories
        const categoriesContainer = document.getElementById('post-categories');
        categoriesContainer.innerHTML = currentPost.categories.map(cat => 
            `<span class="category-tag">${cat}</span>`
        ).join('');

        // Show cover image if available
        if (currentPost.image) {
            const cover = document.getElementById('post-cover');
            const coverImg = document.getElementById('post-cover-img');
            if (cover && coverImg) {
                coverImg.src = currentPost.image;
                cover.style.display = 'block';
            }
        }

        // Load and render markdown content
        await renderMarkdownContent(currentPost);
        
    } catch (error) {
        console.error('Error loading post content:', error);
        showError('Unable to load post content');
    }
}

async function renderMarkdownContent(post) {
    try {
        const contentPath = post.contentPath || `posts/${post.contentFile}`;
        const response = await fetch(contentPath);
        const markdownContent = await response.text();
        
        // Configure marked.js
        marked.setOptions({
            highlight: function(code, lang) {
                // Simple syntax highlighting for code blocks
                return `<pre><code class="language-${lang}">${escapeHtml(code)}</code></pre>`;
            },
            breaks: true,
            gfm: true
        });
        
        // Convert markdown to HTML
        let htmlContent = marked.parse(markdownContent);
        // Base directory for assets
        const baseDir = contentPath.substring(0, contentPath.lastIndexOf('/'));
        
        // Update the content area
        const contentElement = document.getElementById('post-content');
        contentElement.innerHTML = htmlContent;
        
        // Rewrite relative image sources (e.g., ./img.png, ../img.png, images/img.png)
        const imgs = contentElement.querySelectorAll('img');
        imgs.forEach(img => {
            const src = img.getAttribute('src') || '';
            // Skip absolute URLs and root-relative paths
            if (/^(https?:)?\/\//i.test(src) || src.startsWith('/')) return;
            const normalized = src.replace(/^\.\//, '');
            img.setAttribute('src', `${baseDir}/${normalized}`);
        });
        
        // Add custom styling for markdown content
        addMarkdownStyles();
        initializeImageLightbox(contentElement);
        
    } catch (error) {
        console.error('Error rendering markdown:', error);
        showError('Unable to load post content');
    }
}

function addMarkdownStyles() {
    const contentElement = document.getElementById('post-content');
    
    // Add custom styles for markdown content
    const style = document.createElement('style');
    style.textContent = `
        .post-content h1,
        .post-content h2,
        .post-content h3,
        .post-content h4,
        .post-content h5,
        .post-content h6 {
            color: var(--neon-blue);
            margin-top: 2rem;
            margin-bottom: 1rem;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 0.5rem;
        }
        
        .post-content h1 { font-size: 2rem; }
        .post-content h2 { font-size: 1.75rem; }
        .post-content h3 { font-size: 1.5rem; }
        .post-content h4 { font-size: 1.25rem; }
        
        .post-content p {
            margin-bottom: 1.5rem;
            line-height: 1.7;
            color: var(--text-secondary);
        }
        
        .post-content code {
            background: var(--tertiary-bg);
            color: var(--neon-green);
            padding: 0.2rem 0.4rem;
            border-radius: 4px;
            font-family: var(--font-mono);
            font-size: 0.9em;
        }
        
        .post-content pre {
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            padding: 1.5rem;
            overflow-x: auto;
            margin: 1.5rem 0;
        }
        
        .post-content pre code {
            background: none;
            color: var(--text-primary);
            padding: 0;
            font-size: 0.875rem;
            line-height: 1.5;
        }
        
        .post-content blockquote {
            border-left: 4px solid var(--neon-blue);
            background: var(--card-bg);
            padding: 1rem 1.5rem;
            margin: 1.5rem 0;
            border-radius: 0 var(--radius-md) var(--radius-md) 0;
        }
        
        .post-content blockquote p {
            margin: 0;
            color: var(--text-primary);
            font-style: italic;
        }
        
        .post-content ul,
        .post-content ol {
            margin: 1.5rem 0;
            padding-left: 2rem;
        }
        
        .post-content li {
            margin-bottom: 0.5rem;
            color: var(--text-secondary);
        }
        
        .post-content a {
            color: var(--neon-blue);
            text-decoration: none;
            border-bottom: 1px solid transparent;
            transition: border-color 0.3s ease;
        }
        
        .post-content a:hover {
            border-bottom-color: var(--neon-blue);
        }
        
        .post-content img {
            max-width: 100%;
            height: auto;
            border-radius: var(--radius-md);
            margin: 1.5rem 0;
            box-shadow: var(--shadow-md);
        }
        
        .post-content table {
            width: 100%;
            border-collapse: collapse;
            margin: 1.5rem 0;
            background: var(--card-bg);
            border-radius: var(--radius-md);
            overflow: hidden;
        }
        
        .post-content th,
        .post-content td {
            padding: 0.75rem;
            text-align: left;
            border-bottom: 1px solid var(--border-color);
        }
        
        .post-content th {
            background: var(--tertiary-bg);
            color: var(--neon-blue);
            font-weight: 600;
        }
        
        .post-content hr {
            border: none;
            height: 2px;
            background: linear-gradient(90deg, transparent, var(--neon-blue), transparent);
            margin: 2rem 0;
        }
    `;
    
    if (!document.getElementById('markdown-styles')) {
        style.id = 'markdown-styles';
        document.head.appendChild(style);
    }
}


function showError(message) {
    const contentElement = document.getElementById('post-content');
    contentElement.innerHTML = `
        <div class="error-message" style="
            text-align: center;
            padding: 3rem;
            color: var(--neon-red);
        ">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
            <h2>${message}</h2>
            <p>Please try again later or <a href="blog.html">return to the blog</a>.</p>
        </div>
    `;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize post share buttons
function initializePostShareButtons() {
    const shareButtons = {
        'share-post-twitter': 'https://twitter.com/intent/tweet?text=',
        'share-post-linkedin': 'https://www.linkedin.com/sharing/share-offsite/?url=',
        'share-post-email': 'mailto:?subject=',
        'share-post-facebook': 'https://www.facebook.com/sharer/sharer.php?u='
    };

    Object.entries(shareButtons).forEach(([id, baseUrl]) => {
        const button = document.getElementById(id);
        if (button && currentPost) {
            const postUrl = encodeURIComponent(window.location.href);
            const postTitle = encodeURIComponent(currentPost.title);
            
            let shareUrl;
            if (id === 'share-post-email') {
                shareUrl = `${baseUrl}${postTitle}&body=Check out this cybersecurity post: ${postUrl}`;
            } else if (id === 'share-post-facebook') {
                shareUrl = `${baseUrl}${postUrl}`;
            } else {
                shareUrl = `${baseUrl}${postTitle} ${postUrl}`;
            }
            
            button.href = shareUrl;
            button.target = '_blank';
            button.rel = 'noopener noreferrer';
        }
    });
}

function injectDynamicSeo(post) {
    const ensureMeta = (selector, attrs) => {
        let el = document.head.querySelector(selector);
        if (!el) {
            el = document.createElement('meta');
            Object.entries(attrs).forEach(([k,v]) => el.setAttribute(k, v));
            document.head.appendChild(el);
        } else {
            Object.entries(attrs).forEach(([k,v]) => el.setAttribute(k, v));
        }
    };
    const siteName = '0xos4ma';
    const seoTitle = post.seoTitle || `${post.title} | ${siteName}`;
    const description = post.seoDescription || post.excerpt || 'Cybersecurity insights';

    document.title = seoTitle;

    ensureMeta('meta[name="description"]', { name: 'description', content: description });
    ensureMeta('meta[property="og:title"]', { property: 'og:title', content: seoTitle });
    ensureMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    ensureMeta('meta[property="og:type"]', { property: 'og:type', content: 'article' });
    ensureMeta('meta[property="og:url"]', { property: 'og:url', content: window.location.href });
    ensureMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: siteName });
    if (post.image) {
        ensureMeta('meta[property="og:image"]', { property: 'og:image', content: post.image });
        ensureMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: post.image });
    }
    ensureMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    ensureMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: seoTitle });
    ensureMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
}

// Add CSS for post page specific styles
const postStyles = document.createElement('style');
postStyles.textContent = `
    .post-main {
        padding-top: 70px;
        min-height: 100vh;
    }
    
    .post-header {
        padding: 2rem 0;
        border-bottom: 1px solid var(--border-color);
        margin-bottom: 2rem;
    }
    
    .post-breadcrumb {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1rem;
        font-size: 0.875rem;
        color: var(--text-muted);
    }
    
    .post-breadcrumb a {
        color: var(--neon-blue);
        text-decoration: none;
    }
    
    .post-breadcrumb a:hover {
        text-decoration: underline;
    }
    
    .post-breadcrumb i {
        font-size: 0.75rem;
    }
    
    .post-meta h1 {
        font-size: 2.5rem;
        margin-bottom: 1rem;
        color: var(--text-primary);
    }
    
    .post-meta-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
    }
    
    .post-content-wrapper {
        max-width: 800px;
        margin: 0 auto 3rem auto;
    }
    
    .post-share-section {
        padding: var(--spacing-xl) 0;
        background: var(--secondary-bg);
        border-top: 1px solid var(--border-color);
    }
    
    .post-share-section .share-content {
        text-align: center;
        max-width: 600px;
        margin: 0 auto;
    }
    
    .post-share-section .share-content h3 {
        color: var(--neon-blue);
        margin-bottom: var(--spacing-sm);
        font-size: 1.5rem;
    }
    
    .post-share-section .share-content p {
        color: var(--text-secondary);
        margin-bottom: var(--spacing-lg);
    }
    
    .post-share-section .share-buttons {
        display: flex;
        justify-content: center;
        gap: var(--spacing-md);
        flex-wrap: wrap;
    }
    
    .post-share-section .share-btn {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        padding: var(--spacing-sm) var(--spacing-md);
        background: var(--card-bg);
        border: 2px solid var(--border-color);
        border-radius: var(--radius-md);
        color: var(--text-primary);
        text-decoration: none;
        transition: all 0.3s ease;
        font-weight: 500;
    }
    
    .post-share-section .share-btn:hover {
        border-color: var(--neon-blue);
        color: var(--neon-blue);
        transform: translateY(-2px);
        box-shadow: var(--shadow-neon);
    }
    
    .post-share-section .share-btn i {
        font-size: 1.25rem;
    }
    
    .post-content {
        background: var(--card-bg);
        padding: 2rem;
        border-radius: var(--radius-lg);
        border: 1px solid var(--border-color);
        line-height: 1.7;
    }
    
    
    .loading-spinner {
        text-align: center;
        padding: 3rem;
        color: var(--text-muted);
    }
    
    .loading-spinner i {
        font-size: 2rem;
        margin-bottom: 1rem;
        color: var(--neon-blue);
    }
    
    @media (max-width: 768px) {
        .post-content-wrapper {
            max-width: 100%;
            padding: 0 1rem;
        }
        
        .post-meta h1 {
            font-size: 2rem;
        }
        
        .post-meta-info {
            flex-direction: column;
            align-items: flex-start;
        }
        
        .post-content {
            padding: 1.5rem;
        }
        
        .post-share-section .share-buttons {
            flex-direction: column;
            align-items: center;
        }
        
        .post-share-section .share-btn {
            width: 200px;
            justify-content: center;
        }
    }
`;
document.head.appendChild(postStyles);

function initializeImageLightbox(scopeEl) {
    const container = scopeEl || document;
    const images = container.querySelectorAll('img');

    // Ensure lazy loading
    images.forEach(img => {
        if (!img.hasAttribute('loading')) {
            img.setAttribute('loading', 'lazy');
        }
    });

    // Create lightbox elements once
    let lightbox = document.getElementById('img-lightbox');
    if (!lightbox) {
        lightbox = document.createElement('div');
        lightbox.id = 'img-lightbox';
        lightbox.style.position = 'fixed';
        lightbox.style.inset = '0';
        lightbox.style.background = 'rgba(0,0,0,0.85)';
        lightbox.style.display = 'none';
        lightbox.style.alignItems = 'center';
        lightbox.style.justifyContent = 'center';
        lightbox.style.zIndex = '2000';
        lightbox.innerHTML = '<img id="img-lightbox-img" src="" alt="" style="max-width:90%; max-height:90%; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.5);">';
        document.body.appendChild(lightbox);

        lightbox.addEventListener('click', () => {
            lightbox.style.display = 'none';
            const lbImg = document.getElementById('img-lightbox-img');
            if (lbImg) lbImg.src = '';
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                lightbox.style.display = 'none';
            }
        });
    }

    const lbImg = document.getElementById('img-lightbox-img');

    images.forEach(img => {
        // Skip images that are part of UI like icons if needed
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', () => {
            if (!img.src) return;
            if (lbImg) lbImg.src = img.src;
            lightbox.style.display = 'flex';
        });
    });
}
