const comments = document.querySelector('.story-comments');
if (comments) {
 const form = comments.querySelector('form');
 const status = comments.querySelector('[role="status"]');
 const list = comments.querySelector('.comment-list');
 const url = '/api/comments?story=' + encodeURIComponent(comments.dataset.story);
 let rows = [];
 let parentId = null;
 const messageInput = form.elements.message;
 const replyNote = document.createElement('p');
 const cancel = document.createElement('button');
 cancel.type = 'button';
 cancel.textContent = 'Cancel reply';
 replyNote.hidden = cancel.hidden = true;
 form.prepend(replyNote, cancel);
 function chooseParent(comment) {
  parentId = comment?.id || null;
  replyNote.hidden = cancel.hidden = !parentId;
  replyNote.textContent = parentId ? 'Replying to ' + (comment.signature || 'Anonymous') : '';
  form.querySelector('[type="submit"]').textContent = parentId ? 'Post reply' : 'Post comment';
  if (parentId) messageInput.focus();
 }
 cancel.addEventListener('click', () => {chooseParent(null); messageInput.focus();});
 function draw(rows, fresh) {
  function entry(comment) {
   const item = document.createElement('li');
   const message = document.createElement('p');
   message.textContent = comment.message;
   const signature = document.createElement('span');
   signature.className = 'comment-signature' + (comment.id === fresh ? ' reveal' : '');
   signature.textContent = '— ' + (comment.signature || 'Anonymous');
   item.append(message, signature);
   return item;
  }
  list.replaceChildren(...rows.filter(comment => !comment.parentId).map(comment => {
   const item = entry(comment);
   const reply = document.createElement('button');
   reply.type = 'button';
   reply.className = 'comment-reply';
   reply.textContent = 'Reply';
   reply.setAttribute('aria-label', 'Reply to ' + (comment.signature || 'Anonymous'));
   reply.addEventListener('click', () => chooseParent(comment));
   item.append(reply);
   const replies = rows.filter(row => row.parentId === comment.id);
   if (replies.length) {
    const thread = document.createElement('ol');
    thread.className = 'comment-list comment-thread';
    thread.setAttribute('aria-label', 'Replies');
    thread.append(...replies.map(entry));
    item.append(thread);
   }
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
  const button = form.querySelector('[type="submit"]');
  button.disabled = true;
  status.textContent = 'Posting…';
  try {
   const fields = Object.fromEntries(new FormData(form));
   const {comment} = await request({method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...fields,parentId})});
   form.reset();
   chooseParent(null);
   status.textContent = comment.parentId ? 'Your reply is live.' : 'Your comment is live.';
   rows = comment.parentId ? [...rows, comment] : [comment, ...rows];
   draw(rows, comment.id);
  } catch (error) {
   status.textContent = error.message;
  } finally {
   button.disabled = false;
  }
 });
}
