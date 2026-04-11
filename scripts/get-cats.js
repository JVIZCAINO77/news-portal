fetch('https://deultimominuto.net/wp-json/wp/v2/categories?per_page=100')
.then(r => r.json())
.then(data => console.log("deultimominuto:", data.map(d => d.slug).join(', ')));

fetch('https://desenredandodr.com/wp-json/wp/v2/categories?per_page=100')
.then(r => r.json())
.then(data => console.log("desenredandodr:", data.map(d => d.slug).join(', ')));
