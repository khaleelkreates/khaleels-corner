const comments = document.querySelector('.story-comments');
if (comments) {
 const form = comments.querySelector('form');
 const status = comments.querySelector('[role="status"]');
 const list = comments.querySelector('.comment-list');
 const url = '/api/comments?story=' + encodeURIComponent(comments.dataset.story);
 let rows = [];
 function draw(rows, fresh) {
  list.replaceChildren(...rows.map(comment => {
   const item = document.createElement('li');
   const message = document.createElement('p');
   message.textContent = comment.message;
   const signature = document.createElement('span');
   signature.className = 'comment-signature' + (comment.id === fresh ? ' reveal' : '');
   signature.textContent = '— ' + (comment.signature || 'Anonymous');
   item.append(message, signature);
   return item;
  }));
 }
 async function request(options) {
  const response = await fetch(url, options);
  if (response.status === 503 && !options) {
   comments.hidden = true;
   return {rows:[]};
  }
  if (response.status === 429) throw Error('Please wait a moment before posting again.');
  if (!response.ok) throw Error('Comments are unavailable right now. Please try again later.');
  return response.json();
 }
 request().then(data => {
  rows = data.rows;
  draw(rows);
  form.hidden = false;
  if (!rows.length) status.textContent = 'Be the first to leave a note.';
 }).catch(error => {status.textContent = error.message;});
 form.addEventListener('submit', async event => {
  event.preventDefault();
  const button = form.querySelector('button');
  button.disabled = true;
  status.textContent = 'Posting…';
  try {
   const {comment} = await request({method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(new FormData(form)))});
   form.reset();
   status.textContent = 'Your comment is live.';
   rows = [comment, ...rows].slice(0,100);
   draw(rows, comment.id);
  } catch (error) {
   status.textContent = error.message;
  } finally {
   button.disabled = false;
  }
 });
}
