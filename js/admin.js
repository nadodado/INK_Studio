import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', function() {
  // Tab switching
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');
      
      // Update active tab button
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Show corresponding tab content
      tabPanes.forEach(pane => {
        pane.classList.remove('active');
        if (pane.id === `${tabName}-tab`) {
          pane.classList.add('active');
        }
      });
    });
  });

  // Bookings Management
  const bookingsList = document.querySelector('.bookings-list');
  const dateFilter = document.getElementById('date-filter');
  const statusFilter = document.getElementById('status-filter');
  const applyFiltersBtn = document.getElementById('apply-filters');

  async function loadBookings(date = null, status = null) {
    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          artists (
            name
          )
        `)
        .order('booking_date', { ascending: true });

      if (date) {
        query = query.eq('booking_date', date);
      }
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data: bookings, error } = await query;

      if (error) throw error;

      renderBookings(bookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
      alert('Ошибка при загрузке бронирований');
    }
  }

  function renderBookings(bookings) {
    bookingsList.innerHTML = '';
    
    bookings.forEach(booking => {
      const bookingItem = document.createElement('div');
      bookingItem.className = 'booking-item';
      
      bookingItem.innerHTML = `
        <div class="booking-info">
          <h3>${booking.clientName}</h3>
          <p>${booking.phone}</p>
          <p>${booking.description}</p>
          <p>Мастер: ${booking.artist}</p>
        </div>
        <div class="booking-date">
          <p>${booking.date}</p>
          <p>${booking.time}</p>
        </div>
        <div class="booking-status">
          <span class="status-badge status-${booking.status}">
            ${getStatusText(booking.status)}
          </span>
        </div>
        <div class="booking-actions">
          ${getActionButtons(booking.status)}
        </div>
      `;
      
      // Add event listeners to action buttons
      const actionButtons = bookingItem.querySelectorAll('.action-btn');
      actionButtons.forEach(button => {
        button.addEventListener('click', () => {
          const action = button.getAttribute('data-action');
          const status = button.getAttribute('data-status');
          updateBookingStatus(booking.id, status);
        });
      });
      
      bookingsList.appendChild(bookingItem);
    });
  }

  function getStatusText(status) {
    const statusTexts = {
      pending: 'Ожидает',
      confirmed: 'Подтверждено',
      completed: 'Завершено',
      cancelled: 'Отменено'
    };
    return statusTexts[status] || status;
  }

  function getActionButtons(status) {
    switch (status) {
      case 'pending':
        return `
          <button class="action-btn btn-primary" data-action="update" data-status="confirmed">Подтвердить</button>
          <button class="action-btn btn-secondary" data-action="update" data-status="cancelled">Отменить</button>
        `;
      case 'confirmed':
        return `
          <button class="action-btn btn-primary" data-action="update" data-status="completed">Завершить</button>
          <button class="action-btn btn-secondary" data-action="update" data-status="cancelled">Отменить</button>
        `;
      default:
        return '';
    }
  }

  async function updateBookingStatus(bookingId, newStatus) {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;

      // Reload bookings
      loadBookings(dateFilter.value, statusFilter.value);
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Ошибка при обновлении статуса');
    }
  }

  // Filter bookings
  applyFiltersBtn.addEventListener('click', () => {
    loadBookings(dateFilter.value, statusFilter.value);
  });

  // Gallery Management
  const addWorkBtn = document.getElementById('add-work-btn');
  const addWorkModal = document.getElementById('add-work-modal');
  const closeModal = document.querySelector('.close-modal');
  const addWorkForm = document.getElementById('add-work-form');
  const cancelAddWork = document.getElementById('cancel-add-work');
  const adminGallery = document.querySelector('.admin-gallery');

  async function loadGallery() {
    try {
      const { data: galleryItems, error } = await supabase
        .from('gallery_items')
        .select(`
          *,
          artists (
            id,
            name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      renderGallery(galleryItems);
    } catch (error) {
      console.error('Error loading gallery:', error);
      alert('Ошибка при загрузке галереи');
    }
  }

  function renderGallery(galleryItems) {
    adminGallery.innerHTML = '';
    
    galleryItems.forEach(item => {
      const galleryItem = document.createElement('div');
      galleryItem.className = 'gallery-item';
      
      galleryItem.innerHTML = `
        <img src="${item.image_url}" alt="${item.title}">
        <button class="delete-work" data-id="${item.id}">&times;</button>
        <div class="gallery-item-overlay">
          <div class="gallery-item-title">${item.title}</div>
          <div class="gallery-item-artist">
            <div class="artist-avatar">
              <img src="${item.artists.avatar_url}" alt="${item.artists.name}">
            </div>
            <span>${item.artists.name}</span>
          </div>
        </div>
      `;
      
      // Add delete button event listener
      const deleteBtn = galleryItem.querySelector('.delete-work');
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Вы уверены, что хотите удалить эту работу?')) {
          deleteGalleryItem(parseInt(deleteBtn.getAttribute('data-id')));
        }
      });
      
      adminGallery.appendChild(galleryItem);
    });
  }

  async function addGalleryItem(formData) {
    try {
      const newItem = {
        title: formData.get('title'),
        description: formData.get('description'),
        image_url: formData.get('image'),
        style: formData.get('style'),
        artist_id: formData.get('artist')
      };

      const { error } = await supabase
        .from('gallery_items')
        .insert([newItem]);

      if (error) throw error;

      // Reload gallery
      loadGallery();
    } catch (error) {
      console.error('Error adding gallery item:', error);
      alert('Ошибка при добавлении работы');
    }
  }

  async function deleteGalleryItem(itemId) {
    try {
      const { error } = await supabase
        .from('gallery_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      // Reload gallery
      loadGallery();
    } catch (error) {
      console.error('Error deleting gallery item:', error);
      alert('Ошибка при удалении работы');
    }
  }

  // Modal handling
  addWorkBtn.addEventListener('click', () => {
    addWorkModal.classList.add('active');
  });

  function closeAddWorkModal() {
    addWorkModal.classList.remove('active');
    addWorkForm.reset();
  }

  closeModal.addEventListener('click', closeAddWorkModal);
  cancelAddWork.addEventListener('click', closeAddWorkModal);

  addWorkModal.addEventListener('click', (e) => {
    if (e.target === addWorkModal) {
      closeAddWorkModal();
    }
  });

  // Form submission
  addWorkForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addGalleryItem(new FormData(addWorkForm));
    closeAddWorkModal();
  });

  // Initialize
  loadBookings();
  loadGallery();
});