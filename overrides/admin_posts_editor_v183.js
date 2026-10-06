/* TrainingBot Admin - rich post editor v184 */
(()=>{
  "use strict";

  const API="/api/v71/admin/posts";
  const IMAGE_API="/api/v71/admin/image-replace";
  const TOKEN_KEYS=["tb-admin-center-token-v2","tb-admin-center-token-v1","tb-cloud-admin-token-v40","tb-cloud-admin-token-v39"];
  const $=id=>document.getElementById(id);
  const token=()=>TOKEN_KEYS.map(key=>sessionStorage.getItem(key)).find(Boolean)||"";
  const make=(tag,className,text)=>{const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;};
  const esc=value=>String(value??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const slugify=value=>String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/gi,"d").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,72)||"bai-viet";
  const extFor=file=>({"image/png":"png","image/webp":"webp","image/gif":"gif","image/avif":"avif"}[file?.type]||"jpg");

  let currentPost=null;
  let selectedImage=null;
  let savedRange=null;

  function addStyle(){
    if($("tbRichPostStyle"))return;
    const style=document.createElement("style");
    style.id="tbRichPostStyle";
    style.textContent=`
.tb-post-edit{display:inline-flex;align-items:center;justify-content:center;min-height:34px;padding:0 11px;border:1px solid rgba(116,92,255,.42);border-radius:9px;background:rgba(116,92,255,.12);color:#ddd7ff;font-size:10px;font-weight:900;cursor:pointer;white-space:nowrap}
.tb-post-edit:hover{filter:brightness(1.14)}
.tb-rich-modal{position:fixed;inset:0;z-index:100200;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(2,6,18,.84);backdrop-filter:blur(9px)}.tb-rich-modal.open{display:flex}
.tb-rich-dialog{width:min(1120px,100%);height:min(920px,96vh);display:grid;grid-template-rows:auto 1fr;border:1px solid #2a3854;border-radius:20px;background:#0a1220;box-shadow:0 35px 100px rgba(0,0,0,.62);overflow:hidden}
.tb-rich-head{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:15px 18px;border-bottom:1px solid #202d45;background:#0c1525}.tb-rich-head h3{margin:0;font-size:18px}.tb-rich-head small{display:block;margin-top:3px;color:#74849d;font-size:10px}.tb-rich-close{width:38px;height:38px;border:1px solid #2a3854;border-radius:10px;background:#111c30;color:#dce4f2;font-size:21px;cursor:pointer}
.tb-rich-body{min-height:0;display:grid;grid-template-columns:minmax(0,1fr) 285px}
.tb-rich-main{min-width:0;overflow:auto;padding:16px}.tb-rich-side{overflow:auto;padding:16px;border-left:1px solid #202d45;background:#08101d}
.tb-rich-fields{display:grid;grid-template-columns:minmax(0,1fr) 190px;gap:10px;margin-bottom:10px}.tb-rich-field{display:grid;gap:6px}.tb-rich-field label{color:#8fa0ba;font-size:10px;font-weight:900}.tb-rich-field input,.tb-rich-field select,.tb-rich-field textarea{width:100%;box-sizing:border-box;border:1px solid #2a3854;border-radius:10px;background:#071020;color:#fff;padding:10px 11px;outline:none;font:inherit}.tb-rich-field input:focus,.tb-rich-field select:focus,.tb-rich-field textarea:focus{border-color:#745cff}
.tb-rich-toolbar{position:sticky;top:-16px;z-index:4;display:flex;flex-wrap:wrap;gap:6px;padding:10px;margin:0 0 10px;border:1px solid #26344e;border-radius:12px;background:rgba(9,17,31,.97);box-shadow:0 8px 24px rgba(0,0,0,.22)}
.tb-rich-tool,.tb-rich-toolbar select{min-height:34px;border:1px solid #30405f;border-radius:8px;background:#111c30;color:#dce4f2;padding:0 9px;font-size:11px;font-weight:800;cursor:pointer}.tb-rich-tool:hover{border-color:#745cff;color:#fff}.tb-rich-tool.strong{font-weight:1000}.tb-rich-toolbar select{cursor:pointer}
.tb-rich-editor{min-height:430px;padding:22px;border:1px solid #2a3854;border-radius:14px;background:#0b1424;color:#dce4f2;outline:none;font-family:"Segoe UI",Tahoma,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.82;overflow-wrap:anywhere}.tb-rich-editor:focus{border-color:#745cff;box-shadow:0 0 0 3px rgba(116,92,255,.08)}
.tb-rich-editor p{margin:0 0 15px}.tb-rich-editor h2,.tb-rich-editor h3,.tb-rich-editor h4{font-family:"Arial Black","Segoe UI Black","Segoe UI",Arial,sans-serif;font-weight:900;letter-spacing:-.025em}.tb-rich-editor h2{margin:26px 0 10px;font-size:34px;line-height:1.18;color:#fff}.tb-rich-editor h3{margin:22px 0 9px;font-size:27px;line-height:1.2;color:#fff}.tb-rich-editor h4{margin:20px 0 8px;font-size:21px;line-height:1.24;color:#fff}.tb-rich-editor strong,.tb-rich-editor b{font-family:"Segoe UI Semibold","Segoe UI",Arial,sans-serif;font-weight:800;color:#fff}.tb-rich-editor ul,.tb-rich-editor ol{padding-left:25px}.tb-rich-editor blockquote{margin:14px 0;padding:12px 15px;border-left:3px solid #745cff;background:rgba(116,92,255,.09);border-radius:10px}.tb-rich-editor figure{display:grid;justify-items:center;gap:7px;margin:18px 0}.tb-rich-editor img{display:block;max-width:100%;height:auto;border-radius:12px;cursor:pointer}.tb-rich-editor img.tb-rich-image-selected{outline:3px solid #745cff;outline-offset:3px}.tb-rich-editor figcaption{color:#8290a6;font-size:12px}
.tb-rich-note{margin-top:8px;color:#71819b;font-size:10px;line-height:1.5}
.tb-rich-side h4{margin:0 0 10px;font-size:12px}.tb-rich-cover{width:100%;aspect-ratio:16/9;display:grid;place-items:center;margin-bottom:9px;border:1px dashed #31415f;border-radius:12px;background:#071020;overflow:hidden;color:#66768f;font-size:10px}.tb-rich-cover img{width:100%;height:100%;object-fit:cover}
.tb-rich-side-btn{width:100%;min-height:38px;border:1px solid #30405f;border-radius:10px;background:#111c30;color:#dce4f2;font-size:10px;font-weight:900;cursor:pointer}.tb-rich-side-btn.primary{border:0;background:linear-gradient(135deg,#745cff,#2acbea);color:#fff}.tb-rich-side-btn:disabled{opacity:.55;cursor:wait}
.tb-rich-image-tools{display:none;margin-top:16px;padding-top:15px;border-top:1px solid #202d45}.tb-rich-image-tools.open{display:grid;gap:10px}.tb-rich-image-size{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center}.tb-rich-image-size input{width:100%}.tb-rich-image-size output{min-width:38px;color:#b8c4d7;font-size:10px;text-align:right}.tb-rich-preset{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}.tb-rich-preset button{min-height:30px;border:1px solid #2e3d59;border-radius:8px;background:#0e1829;color:#b8c4d7;font-size:9px;font-weight:900;cursor:pointer}
.tb-rich-status{min-height:20px;margin:12px 0 6px;color:#8fa0ba;font-size:10px;line-height:1.45}.tb-rich-status.ok{color:#86efac}.tb-rich-status.error{color:#fda4af}.tb-rich-status a{color:#aef5ff;font-weight:900}
.tb-rich-save{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}
@media(max-width:820px){.tb-rich-modal{padding:6px}.tb-rich-dialog{height:98vh;border-radius:14px}.tb-rich-body{grid-template-columns:1fr}.tb-rich-side{border-left:0;border-top:1px solid #202d45}.tb-rich-fields{grid-template-columns:1fr}.tb-rich-editor{min-height:390px;padding:16px}.tb-rich-toolbar{top:-16px}.tb-post-row-actions{grid-template-columns:1fr 1fr!important}.tb-post-edit{width:100%;box-sizing:border-box}}
`;
    document.head.appendChild(style);
  }

  function setStatus(message,type="",link=""){
    const node=$("tbRichStatus");if(!node)return;
    node.className=`tb-rich-status ${type}`;
    node.replaceChildren(document.createTextNode(message||""));
    if(link){
      node.append(document.createTextNode(" "));
      const a=make("a","","Mở bài ↗");a.href=link;a.target="_blank";a.rel="noopener";node.appendChild(a);
    }
  }

  function markdownToHtml(source){
    const lines=String(source||"").replace(/\r/g,"").split("\n");
    const out=[];let paragraph=[];let list=null;let items=[];
    const inline=value=>esc(value).replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>");
    const flushP=()=>{if(paragraph.length){out.push(`<p>${paragraph.map(inline).join("<br>")}</p>`);paragraph=[];}};
    const flushList=()=>{if(items.length){out.push(`<${list||"ul"}>${items.map(x=>`<li>${inline(x)}</li>`).join("")}</${list||"ul"}>`);items=[];list=null;}};
    for(const raw of lines){
      const line=raw.trim();
      if(!line){flushP();flushList();continue;}
      if(line.startsWith("### ")){flushP();flushList();out.push(`<h3>${inline(line.slice(4))}</h3>`);continue;}
      if(line.startsWith("## ")){flushP();flushList();out.push(`<h2>${inline(line.slice(3))}</h2>`);continue;}
      if(line.startsWith("- ")||line.startsWith("* ")){flushP();list="ul";items.push(line.slice(2));continue;}
      flushList();paragraph.push(line);
    }
    flushP();flushList();
    return out.join("");
  }

  function rememberRange(){
    const editor=$("tbRichEditor");const sel=window.getSelection();
    if(!editor||!sel||!sel.rangeCount)return;
    const range=sel.getRangeAt(0);
    if(editor.contains(range.commonAncestorContainer))savedRange=range.cloneRange();
  }
  function restoreRange(){
    if(!savedRange)return false;
    const sel=window.getSelection();sel.removeAllRanges();sel.addRange(savedRange);return true;
  }
  function exec(command,value=null){
    $("tbRichEditor")?.focus();
    document.execCommand(command,false,value);
    rememberRange();
  }
  function setBlock(tag){
    if(!tag)return;
    exec("formatBlock",tag);
  }
  function setFontSize(px){
    if(!px)return;
    $("tbRichEditor")?.focus();
    document.execCommand("fontSize",false,"7");
    $("tbRichEditor")?.querySelectorAll('font[size="7"]').forEach(font=>{
      const span=document.createElement("span");
      span.style.fontSize=`${px}px`;
      while(font.firstChild)span.appendChild(font.firstChild);
      font.replaceWith(span);
    });
    rememberRange();
  }
  function setFontFamily(family){
    if(!family)return;
    $("tbRichEditor")?.focus();
    document.execCommand("fontName",false,family);
    $("tbRichEditor")?.querySelectorAll("font[face]").forEach(font=>{
      const span=document.createElement("span");
      span.style.fontFamily=font.getAttribute("face")||family;
      while(font.firstChild)span.appendChild(font.firstChild);
      font.replaceWith(span);
    });
    rememberRange();
  }

  function imageTarget(file,prefix="inline"){
    const base=slugify(currentPost?.slug||currentPost?.title||"bai-viet");
    return `/user-posts/${base}-${prefix}-${Date.now()}.${extFor(file)}`;
  }
  async function uploadImage(file,target){
    if(!file)throw new Error("Chưa chọn ảnh.");
    if(!String(file.type||"").startsWith("image/"))throw new Error("File được chọn không phải ảnh.");
    if(file.size>12*1024*1024)throw new Error("Ảnh vượt quá 12 MB.");
    const auth=token();if(!auth)throw new Error("Phiên quản trị không còn hợp lệ.");
    const form=new FormData();form.set("target",target);form.set("file",file);
    const response=await fetch(IMAGE_API,{method:"POST",headers:{Authorization:`Bearer ${auth}`},body:form,cache:"no-store"});
    const data=await response.json().catch(()=>({}));
    if(!response.ok||!data.ok)throw new Error(data.message||"Không tải được ảnh.");
    return data.url||target;
  }

  function insertImageUrl(url,alt=""){
    const editor=$("tbRichEditor");if(!editor)return;
    editor.focus();restoreRange();
    const html=`<figure><img src="${esc(url)}" alt="${esc(alt)}" style="width:100%"><figcaption></figcaption></figure><p><br></p>`;
    document.execCommand("insertHTML",false,html);
    rememberRange();
  }

  function selectImage(img){
    $("tbRichEditor")?.querySelectorAll("img.tb-rich-image-selected").forEach(x=>x.classList.remove("tb-rich-image-selected"));
    selectedImage=img||null;
    const tools=$("tbRichImageTools");
    if(!img){tools?.classList.remove("open");return;}
    img.classList.add("tb-rich-image-selected");
    tools?.classList.add("open");
    const width=parseInt(img.style.width||"100",10)||100;
    if($("tbRichImageWidth"))$("tbRichImageWidth").value=String(Math.min(100,Math.max(10,width)));
    if($("tbRichImageWidthOut"))$("tbRichImageWidthOut").value=`${width}%`;
    if($("tbRichImageAlt"))$("tbRichImageAlt").value=img.alt||"";
  }

  function buildModal(){
    if($("tbRichPostModal"))return;
    const modal=make("div","tb-rich-modal");modal.id="tbRichPostModal";
    const dialog=make("section","tb-rich-dialog");dialog.setAttribute("role","dialog");dialog.setAttribute("aria-modal","true");
    const head=make("header","tb-rich-head");
    const hc=make("div","");hc.append(make("h3","","Sửa bài viết"),make("small","","Chỉnh trực tiếp chữ, tiêu đề và ảnh trong bài."));
    const close=make("button","tb-rich-close","×");close.type="button";close.dataset.richClose="1";head.append(hc,close);

    const body=make("div","tb-rich-body");
    const main=make("div","tb-rich-main");
    const fields=make("div","tb-rich-fields");
    const title=document.createElement("input");title.id="tbRichTitle";title.maxLength=180;
    const cat=document.createElement("select");cat.id="tbRichCategory";["Tin mới","Bản cập nhật","Giải đấu & Esports","Cộng đồng","Hướng dẫn"].forEach(v=>{const o=document.createElement("option");o.value=v;o.textContent=v;cat.appendChild(o);});
    const titleWrap=make("div","tb-rich-field");titleWrap.append(make("label","","TIÊU ĐỀ"),title);
    const catWrap=make("div","tb-rich-field");catWrap.append(make("label","","CHUYÊN MỤC"),cat);fields.append(titleWrap,catWrap);
    const summary=document.createElement("textarea");summary.id="tbRichSummary";summary.maxLength=260;summary.rows=2;
    const summaryWrap=make("div","tb-rich-field");summaryWrap.append(make("label","","MÔ TẢ NGẮN"),summary);

    const toolbar=make("div","tb-rich-toolbar");
    toolbar.innerHTML=`
      <select id="tbRichBlock" aria-label="Kiểu đoạn">
        <option value="p">Đoạn văn</option><option value="h2">Tiêu đề lớn</option><option value="h3">Tiêu đề vừa</option><option value="h4">Tiêu đề nhỏ</option><option value="blockquote">Trích dẫn</option>
      </select>
      <select id="tbRichFont" aria-label="Phông chữ">
        <option value="">Phông chữ</option>
        <option value="Segoe UI">Segoe UI</option>
        <option value="Arial Black">Arial Black — rất đậm</option>
        <option value="Arial">Arial</option>
        <option value="Tahoma">Tahoma</option>
        <option value="Verdana">Verdana</option>
        <option value="Trebuchet MS">Trebuchet MS</option>
        <option value="Georgia">Georgia</option>
        <option value="Times New Roman">Times New Roman</option>
      </select>
      <button type="button" class="tb-rich-tool strong" data-cmd="bold">B</button>
      <button type="button" class="tb-rich-tool" data-cmd="italic"><i>I</i></button>
      <button type="button" class="tb-rich-tool" data-cmd="underline"><u>U</u></button>
      <select id="tbRichSize" aria-label="Cỡ chữ">
        <option value="">Cỡ chữ</option><option>12</option><option>14</option><option>16</option><option>18</option><option>20</option><option>24</option><option>28</option><option>32</option><option>36</option><option>42</option><option>48</option><option>56</option><option>64</option><option>72</option>
      </select>
      <button type="button" class="tb-rich-tool" data-cmd="insertUnorderedList">• Danh sách</button>
      <button type="button" class="tb-rich-tool" data-cmd="justifyLeft">←</button>
      <button type="button" class="tb-rich-tool" data-cmd="justifyCenter">↔</button>
      <button type="button" class="tb-rich-tool" data-cmd="justifyRight">→</button>
      <button type="button" class="tb-rich-tool" id="tbRichInsertImage">🖼 Thêm ảnh</button>
      <button type="button" class="tb-rich-tool" data-cmd="undo">↶</button>
      <button type="button" class="tb-rich-tool" data-cmd="redo">↷</button>
      <input id="tbRichInlineFile" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" hidden>
    `;

    const editor=make("div","tb-rich-editor");editor.id="tbRichEditor";editor.contentEditable="true";editor.spellcheck=true;
    const note=make("div","tb-rich-note","Bôi đen 1 chữ, 1 câu hoặc 1 đoạn rồi chọn phông chữ hoặc cỡ chữ. Tiêu đề lớn dùng font đậm riêng để nổi bật rõ. Bấm vào ảnh trong bài để đổi ảnh hoặc chỉnh kích thước.");
    main.append(fields,summaryWrap,toolbar,editor,note);

    const side=make("aside","tb-rich-side");
    side.append(make("h4","","Ảnh bìa"));
    const cover=make("div","tb-rich-cover","Chưa có ảnh bìa");cover.id="tbRichCoverPreview";
    const coverInput=document.createElement("input");coverInput.id="tbRichCoverFile";coverInput.type="file";coverInput.accept="image/png,image/jpeg,image/webp,image/gif,image/avif";coverInput.hidden=true;
    const coverBtn=make("button","tb-rich-side-btn","Thay ảnh bìa");coverBtn.id="tbRichCoverPick";coverBtn.type="button";
    side.append(cover,coverInput,coverBtn);

    const imageTools=make("section","tb-rich-image-tools");imageTools.id="tbRichImageTools";
    imageTools.append(make("h4","","Ảnh đang chọn"));
    const sizeWrap=make("div","tb-rich-image-size");
    const range=document.createElement("input");range.id="tbRichImageWidth";range.type="range";range.min="10";range.max="100";range.step="5";range.value="100";
    const out=document.createElement("output");out.id="tbRichImageWidthOut";out.value="100%";sizeWrap.append(range,out);
    const preset=make("div","tb-rich-preset");[25,50,75,100].forEach(v=>{const b=make("button","",`${v}%`);b.type="button";b.dataset.imageWidth=v;preset.appendChild(b);});
    const altWrap=make("div","tb-rich-field");const alt=document.createElement("input");alt.id="tbRichImageAlt";alt.placeholder="Mô tả ảnh";altWrap.append(make("label","","MÔ TẢ ẢNH"),alt);
    const replaceInput=document.createElement("input");replaceInput.id="tbRichReplaceFile";replaceInput.type="file";replaceInput.accept=coverInput.accept;replaceInput.hidden=true;
    const replaceBtn=make("button","tb-rich-side-btn","Đổi ảnh đang chọn");replaceBtn.id="tbRichReplacePick";replaceBtn.type="button";
    const removeBtn=make("button","tb-rich-side-btn","Xóa ảnh khỏi bài");removeBtn.id="tbRichRemoveImage";removeBtn.type="button";
    imageTools.append(sizeWrap,preset,altWrap,replaceInput,replaceBtn,removeBtn);side.appendChild(imageTools);

    const status=make("div","tb-rich-status");status.id="tbRichStatus";
    const actions=make("div","tb-rich-save");
    const cancel=make("button","tb-rich-side-btn","Đóng");cancel.type="button";cancel.dataset.richClose="1";
    const save=make("button","tb-rich-side-btn primary","Lưu thay đổi");save.type="button";save.id="tbRichSave";
    actions.append(cancel,save);side.append(status,actions);

    body.append(main,side);dialog.append(head,body);modal.appendChild(dialog);document.body.appendChild(modal);

    modal.addEventListener("click",e=>{if(e.target===modal||e.target.closest("[data-rich-close]"))closeModal();});
    toolbar.addEventListener("mousedown",e=>{if(e.target.closest("button,select"))rememberRange();});
    toolbar.addEventListener("click",e=>{
      const button=e.target.closest("[data-cmd]");if(button)exec(button.dataset.cmd);
    });
    $("tbRichBlock").addEventListener("change",e=>{restoreRange();setBlock(e.target.value);e.target.value="p";});
    $("tbRichFont").addEventListener("change",e=>{restoreRange();setFontFamily(e.target.value);e.target.value="";});
    $("tbRichSize").addEventListener("change",e=>{restoreRange();setFontSize(Number(e.target.value));e.target.value="";});
    editor.addEventListener("mouseup",rememberRange);editor.addEventListener("keyup",rememberRange);
    editor.addEventListener("click",e=>selectImage(e.target.closest("img")));
    editor.addEventListener("paste",e=>{
      const text=e.clipboardData?.getData("text/plain");
      if(text!==undefined){e.preventDefault();document.execCommand("insertText",false,text);}
    });

    $("tbRichInsertImage").addEventListener("click",()=>{rememberRange();const input=$("tbRichInlineFile");input.value="";input.click();});
    $("tbRichInlineFile").addEventListener("change",async e=>{
      const file=e.target.files?.[0];if(!file)return;
      setStatus(`Đang tải ảnh ${file.name}…`);
      try{const url=await uploadImage(file,imageTarget(file,"inline"));insertImageUrl(url,file.name.replace(/\.[^.]+$/,""));setStatus("✓ Đã chèn ảnh vào vị trí đã chọn.","ok");}
      catch(error){setStatus(error.message||"Không thêm được ảnh.","error");}
    });

    coverBtn.addEventListener("click",()=>{coverInput.value="";coverInput.click();});
    coverInput.addEventListener("change",async e=>{
      const file=e.target.files?.[0];if(!file)return;
      coverBtn.disabled=true;setStatus("Đang tải ảnh bìa…");
      try{
        const url=await uploadImage(file,imageTarget(file,"cover"));
        currentPost.cover_url=url;renderCover(url);setStatus("✓ Đã tải ảnh bìa mới. Bấm “Lưu thay đổi” để áp dụng.","ok");
      }catch(error){setStatus(error.message||"Không thay được ảnh bìa.","error");}
      finally{coverBtn.disabled=false;}
    });

    range.addEventListener("input",()=>{if(!selectedImage)return;selectedImage.style.width=`${range.value}%`;out.value=`${range.value}%`;});
    preset.addEventListener("click",e=>{const b=e.target.closest("[data-image-width]");if(!b||!selectedImage)return;const v=b.dataset.imageWidth;selectedImage.style.width=`${v}%`;range.value=v;out.value=`${v}%`;});
    alt.addEventListener("input",()=>{if(selectedImage)selectedImage.alt=alt.value;});
    replaceBtn.addEventListener("click",()=>{replaceInput.value="";replaceInput.click();});
    replaceInput.addEventListener("change",async e=>{
      const file=e.target.files?.[0];if(!file||!selectedImage)return;
      replaceBtn.disabled=true;setStatus("Đang thay ảnh…");
      try{
        const url=await uploadImage(file,imageTarget(file,"image"));
        selectedImage.src=url;selectedImage.alt=file.name.replace(/\.[^.]+$/,"");alt.value=selectedImage.alt;setStatus("✓ Đã đổi ảnh. Bấm “Lưu thay đổi” để áp dụng.","ok");
      }catch(error){setStatus(error.message||"Không đổi được ảnh.","error");}
      finally{replaceBtn.disabled=false;}
    });
    removeBtn.addEventListener("click",()=>{if(!selectedImage)return;const figure=selectedImage.closest("figure");(figure||selectedImage).remove();selectImage(null);});
    save.addEventListener("click",savePost);
  }

  function renderCover(url){
    const box=$("tbRichCoverPreview");if(!box)return;
    box.replaceChildren();
    if(!url){box.textContent="Chưa có ảnh bìa";return;}
    const img=document.createElement("img");img.src=url;img.alt="Ảnh bìa";box.appendChild(img);
  }

  async function openEditor(id){
    const auth=token();if(!auth)return alert("Phiên quản trị không còn hợp lệ. Hãy đăng nhập lại.");
    buildModal();setStatus("Đang tải bài viết…");$("tbRichPostModal").classList.add("open");
    try{
      const response=await fetch(`${API}?id=${encodeURIComponent(id)}`,{headers:{Authorization:`Bearer ${auth}`},cache:"no-store"});
      const data=await response.json().catch(()=>({}));if(!response.ok||!data.ok)throw new Error(data.message||"Không tải được bài viết.");
      currentPost=data.post;
      $("tbRichTitle").value=currentPost.title||"";
      $("tbRichSummary").value=currentPost.summary||"";
      $("tbRichCategory").value=currentPost.category||"Tin mới";
      $("tbRichEditor").innerHTML=currentPost.rich_content||markdownToHtml(currentPost.content||"");
      renderCover(currentPost.cover_url||"");selectImage(null);setStatus("Có thể chỉnh trực tiếp nội dung bên trái.");
      setTimeout(()=>$("tbRichEditor")?.focus(),0);
    }catch(error){setStatus(error.message||"Không tải được bài viết.","error");}
  }

  function closeModal(){
    $("tbRichPostModal")?.classList.remove("open");selectImage(null);currentPost=null;savedRange=null;
  }

  async function savePost(){
    if(!currentPost)return;
    const auth=token();if(!auth)return setStatus("Phiên quản trị không còn hợp lệ.","error");
    const title=$("tbRichTitle").value.trim();
    const summary=$("tbRichSummary").value.trim();
    const category=$("tbRichCategory").value;
    const editor=$("tbRichEditor");
    const content=editor.innerText.replace(/\n{3,}/g,"\n\n").trim();
    const rich_content=editor.innerHTML.trim();
    if(title.length<4)return setStatus("Tiêu đề quá ngắn.","error");
    if(content.length<20&&!rich_content)return setStatus("Nội dung bài viết quá ngắn.","error");
    const button=$("tbRichSave");button.disabled=true;setStatus("Đang lưu thay đổi…");
    try{
      const response=await fetch(API,{method:"PATCH",headers:{Authorization:`Bearer ${auth}`,"Content-Type":"application/json"},body:JSON.stringify({
        id:currentPost.id,title,summary,category,content,rich_content,cover_url:currentPost.cover_url||""
      })});
      const data=await response.json().catch(()=>({}));if(!response.ok||!data.ok)throw new Error(data.message||"Không lưu được bài viết.");
      currentPost=data.post;setStatus("✓ Đã lưu. Trang bài viết đã được cập nhật.","ok",data.post.url);
      document.dispatchEvent(new CustomEvent("tb:post-updated",{detail:data.post}));
      setTimeout(()=>{document.querySelector(".tb-post-refresh")?.click();},250);
    }catch(error){setStatus(error.message||"Không lưu được bài viết.","error");}
    finally{button.disabled=false;}
  }

  function attachEditButtons(){
    const list=$("tbPostPublishedList");if(!list)return false;
    list.querySelectorAll(".tb-post-row").forEach(row=>{
      if(row.querySelector(".tb-post-edit"))return;
      const del=row.querySelector("button[data-delete-post]");if(!del)return;
      const button=make("button","tb-post-edit","Sửa bài viết");button.type="button";button.dataset.editPost=del.dataset.deletePost;
      del.parentElement?.insertBefore(button,del);
    });
    return true;
  }

  function boot(){
    addStyle();buildModal();
    let tries=0;
    const tick=()=>{
      const list=$("tbPostPublishedList");
      if(list){
        attachEditButtons();
        new MutationObserver(attachEditButtons).observe(list,{childList:true,subtree:true});
        list.addEventListener("click",e=>{const button=e.target.closest("button[data-edit-post]");if(button)openEditor(button.dataset.editPost);});
        return;
      }
      if(++tries<140)setTimeout(tick,120);
    };
    tick();
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
