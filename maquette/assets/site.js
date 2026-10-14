// Copy buttons: copy the <pre> text of the block they head.
document.querySelectorAll('button').forEach(function (btn) {
  if (btn.textContent.trim() !== 'Copy') return;
  btn.addEventListener('click', function () {
    var box = btn.closest('div');
    var pre = box && box.parentElement ? box.parentElement.querySelector('pre') : null;
    if (!pre) return;
    var text = pre.innerText.replace(/^\$ /gm, '').replace(/\s+#.*$/gm, '');
    navigator.clipboard.writeText(text).then(function () {
      btn.textContent = 'Copied';
      btn.classList.add('copied');
      setTimeout(function () { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 1500);
    });
  });
});
// "/" focuses the docs search.
var search = document.getElementById('docs-search');
if (search) {
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && document.activeElement !== search) { e.preventDefault(); search.focus(); }
  });
}
