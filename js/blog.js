import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', async function() {
  const blogGrid = document.querySelector('.blog-grid');
  const postContainer = document.querySelector('.post-content');
  
  // Check if we're on a single post page
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('id');
  
  if (postId) {
    // Load single post
    try {
      const { data: post, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', postId)
        .single();
        
      if (error) throw error;
      
      if (post) {
        document.title = `${post.title} - INK Studio`;
        renderSinglePost(post);
      }
    } catch (error) {
      console.error('Error loading post:', error);
      postContainer.innerHTML = '<p class="error">Пост не найден</p>';
    }
  } else {
    // Load blog listing
    try {
      const { data: posts, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      renderBlogListing(posts);
    } catch (error) {
      console.error('Error loading posts:', error);
      blogGrid.innerHTML = '<p class="error">Ошибка загрузки постов</p>';
    }
  }
});

function renderBlogListing(posts) {
  const blogGrid = document.querySelector('.blog-grid');
  blogGrid.innerHTML = '';
  
  posts.forEach(post => {
    const article = document.createElement('article');
    article.className = 'blog-card';
    
    article.innerHTML = `
      <div class="blog-image">
        <img src="${post.image_url}" alt="${post.title}">
      </div>
      <div class="blog-content">
        <h3>${post.title}</h3>
        <p class="blog-date">${new Date(post.created_at).toLocaleDateString('ru-RU')}</p>
        <p class="blog-excerpt">${post.excerpt}</p>
        <div class="blog-meta">
          <span class="blog-category">${post.category}</span>
          <span class="blog-read-time">${post.read_time} мин чтения</span>
        </div>
        <a href="blog-post.html?id=${post.id}" class="read-more">Читать далее</a>
      </div>
    `;
    
    blogGrid.appendChild(article);
  });
}

function renderSinglePost(post) {
  const postContainer = document.querySelector('.post-content');
  
  postContainer.innerHTML = `
    <div class="post-header">
      <div class="post-image">
        <img src="${post.image_url}" alt="${post.title}">
      </div>
      <h1>${post.title}</h1>
      <div class="post-meta">
        <span class="post-date">${new Date(post.created_at).toLocaleDateString('ru-RU')}</span>
        <span class="post-category">${post.category}</span>
        <span class="post-read-time">${post.read_time} мин чтения</span>
      </div>
    </div>
    <div class="post-body">
      ${post.content}
    </div>
  `;
}