const form = document.querySelector('#form');
const images = document.querySelector('#images');
const card = document.querySelector('#card');

const newImageBtn = document.querySelector('#new-image-btn');
const imagesBtn = document.querySelector('#images-btn');
const submitBtn = document.querySelector('#submit-btn');

function revealCards() {
    const divNodes = Array.from(images.childNodes).filter(item => item.nodeName === 'DIV');

    for (let node of divNodes) {
        const current = node.childNodes[1];
        current.style.removeProperty('display');
        current.style.width = '30rem';
        current.style.marginBottom = '3rem';
    }

    imagesBtn.classList.add('active');
    newImageBtn.classList.remove('active');
    form.style.display = 'none';
}

function revealForm() {
    const divNodes = Array.from(images.childNodes).filter(item => item.nodeName === 'DIV');

    for (let node of divNodes) {
        if (node) {
            const current = node.childNodes[1];
            current.style.display = 'none';
        } else {
            return;
        }
    }

    newImageBtn.classList.add('active');
    imagesBtn.classList.remove('active');
    form.style.removeProperty('display');
}

newImageBtn.addEventListener('click', revealForm);

imagesBtn.addEventListener('click', revealCards);

(async () => {
    const response = await fetch('/all', { method: 'GET' });
    if (response.ok) {
        const imageData = await response.json();
        imageData.forEach(image => {
            addCard(image.imageName, image.caption, image.imageUrl, image.id);
        });
        revealCards();
    } else {
        console.log('Error getting image');
    }
})().then(() => {
    const deleteBtns = document.querySelectorAll('.delete-btn');
    deleteBtns.forEach(deleteBtn => {
        if (deleteBtn) {
            deleteBtn.addEventListener('click', async (event) => {
                const id = event.target.parentElement.getAttribute('data-id');
                const response = await fetch(`/images/${id}`, { method: 'DELETE' });
                if (response.ok) {
                    console.log('Image deleted successfully');
                    event.target.parentElement.remove();
                } else {
                    console.log('Error deleting image');
                }
            });
        }
    })
});

function addCard(imageName, caption, imageUrl, imageId) {
    const div = document.createElement('div');
    div.innerHTML = `
    <div id="card" class="card mx-auto" style="display: none;" data-id="${imageId}">
        <img class="card-img-top" src="${imageUrl}" alt="${imageName}">
        <div class="card-body">
            <h5 class="card-title">Caption</h5>
            <p class="card-text">${caption}</p>
        </div>
        <button type="button" class="btn btn-outline-danger delete-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash"
                viewBox="0 0 16 16">
                <path
                    d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z">
                </path>
                <path
                    d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z">
                </path>
            </svg>
        </button>
    </div>
    `;
    images.appendChild(div);
}

submitBtn.addEventListener('click', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    await fetch('/newImage', {
        method: 'POST',
        body: formData
    });
});