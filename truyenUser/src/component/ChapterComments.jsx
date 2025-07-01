// src/components/ChapterComments.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  getCommentsByChapter,
  createComment,
  deleteComment,
  likeComment,
  dislikeComment,
  clearComments,
  clearCommentError,
  updateCommentContent
} from '../redux/commentSlice';
import {
    Send as LucideSend,
    MessageSquare as LucideReply,
    ThumbsUp as LucideThumbsUp,
    ThumbsDown as LucideThumbsDown,
    Trash2 as LucideTrash,
    Edit3 as LucideEdit,
    Loader2 as LucideSpinner,
    MoreVertical as LucideMoreVertical,
} from 'lucide-react';

const formatCommentDate = (dateArray) => {
  if (!dateArray || dateArray.length < 6) return '';
  try {
    const [year, month, day, hour, minute, second] = dateArray;
    const date = new Date(year, month - 1, day, hour, minute, second);
    if (isNaN(date.getTime())) return 'Thời gian không hợp lệ';
    return date.toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch (e) { return 'Không rõ thời gian'; }
};

// Component con để render một comment và các reply của nó
const CommentItem = ({
  comment,
  currentUser,
  chapterId,
  novelId,
  // Hàm xử lý từ ChapterComments (component cha)
  onLike,
  onDislike,
  onDelete,
  onStartEdit,
  onStartReply,
  // --- Props được truyền từ ChapterComments và sẽ được truyền xuống tiếp cho các reply con ---
  // Liên quan đến việc sửa comment (global state từ ChapterComments)
  globalEditingComment,
  globalEditedContent,
  onGlobalEditedContentChange,
  onGlobalUpdateComment,
  onGlobalCancelEdit,
  isGlobalUpdatingComment,
  // Liên quan đến việc reply comment (global state từ ChapterComments)
  globalReplyingToCommentId,
  globalReplyContent,
  onGlobalReplyContentChange,
  onGlobalSubmitReply,
  onGlobalCancelReply,
  isGlobalSubmittingReply,
  // Props chung cho dropdown
  openDropdownId,
  onToggleDropdown,
  assignDropdownRef,
  level = 0
}) => {
  // Backend cần trả về comment.user.idUser để so sánh chính xác
  // Nếu API comment của bạn trả về object user lồng nhau: comment.user.idUser và comment.user.userNameUser
  const isOwner = currentUser && comment.user && currentUser.idUser === comment.user.idUser;
  // Fallback nếu API comment chỉ trả về userName trực tiếp và không có object user
  const isOwnerFallback = !comment.user && currentUser && currentUser.userNameUser === comment.userName;
  const canModify = isOwner || isOwnerFallback;

  // Xác định xem comment hiện tại có phải là comment đang được sửa không
  const isCurrentlyEditingThisItem = globalEditingComment?.idComment === comment.idComment;
  // Xác định xem có đang mở form reply cho comment này không
  const isCurrentlyReplyingToThisItem = globalReplyingToCommentId === comment.idComment;

  return (
    <div className={` ${level > 0 ? `ml-${level === 1 ? 4 : 8} sm:ml-${level === 1 ? 6 : 10} mt-3 pt-3 border-t border-gray-700/50` : ''}`}>
      <div className="flex items-start space-x-2 sm:space-x-3">
        <div className={`flex-shrink-0 rounded-full bg-gray-600 flex items-center justify-center text-gray-400 font-semibold ${level > 0 ? 'w-7 h-7 text-xs' : 'w-8 h-8 text-sm'}`}>
          {comment.user?.avatarUser ? (
            <img src={comment.user.avatarUser} alt={comment.user.userNameUser || 'Avatar'} className="w-full h-full rounded-full object-cover" />
          ) : (
            comment.userName ? comment.userName.charAt(0).toUpperCase() : '?'
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <p className={`font-semibold text-sky-400 ${level > 0 ? 'text-xs' : 'text-sm'}`}>
              {comment.user?.userNameUser || comment.userName || "Vô Danh"}
            </p>
            {canModify && !isCurrentlyEditingThisItem && (
              <div className="relative" ref={(el) => assignDropdownRef(el, comment.idComment)}>
                <button
                  onClick={() => onToggleDropdown(comment.idComment)}
                  className="p-0.5 text-gray-400 hover:text-gray-200 rounded-full focus:outline-none"
                  aria-label="Tùy chọn"
                >
                  <LucideMoreVertical size={level > 0 ? 14 : 16} />
                </button>
                {openDropdownId === comment.idComment && (
                  <div className="absolute right-0 mt-1 w-32 bg-gray-700 border border-gray-600 rounded-md shadow-lg z-20 py-1">
                    <button onClick={() => onStartEdit(comment)} className="w-full text-left px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-600 flex items-center">
                      <LucideEdit size={14} className="mr-2" /> Sửa
                    </button>
                    <button onClick={() => onDelete(comment.idComment)} className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-red-600 hover:text-white flex items-center">
                      <LucideTrash size={14} className="mr-2" /> Xóa
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {isCurrentlyEditingThisItem ? (
            <form onSubmit={onGlobalUpdateComment} className="mt-1">
              <textarea
                className="w-full p-2 text-sm bg-gray-600 text-gray-100 border border-gray-500 rounded-md focus:ring-1 focus:ring-sky-500"
                rows="2" value={globalEditedContent} onChange={onGlobalEditedContentChange} required disabled={isGlobalUpdatingComment} autoFocus
              />
              <div className="mt-1 flex items-center space-x-2">
                <button type="submit" disabled={isGlobalUpdatingComment || !globalEditedContent?.trim()} className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-md disabled:opacity-60 flex items-center">
                  {isGlobalUpdatingComment && <LucideSpinner size={12} className="animate-spin mr-1" />} Lưu
                </button>
                <button type="button" onClick={onGlobalCancelEdit} disabled={isGlobalUpdatingComment} className="px-2.5 py-1 bg-gray-500 hover:bg-gray-600 text-white text-xs font-semibold rounded-md">
                  Hủy
                </button>
              </div>
            </form>
          ) : (
            <p className={`text-gray-200 whitespace-pre-wrap mt-0.5 ${level > 0 ? 'text-xs' : 'text-sm'}`}>{comment.contentComment}</p>
          )}

          <div className="flex items-center space-x-3 sm:space-x-4 mt-2 text-xs text-gray-400">
            <button onClick={() => onLike(comment)} className="hover:text-sky-400 flex items-center disabled:opacity-50" disabled={!currentUser} title="Thích">
              <LucideThumbsUp size={14} className="mr-1" /> {comment.likeComment || 0}
            </button>
            <button onClick={() => onDislike(comment)} className="hover:text-red-400 flex items-center disabled:opacity-50" disabled={!currentUser} title="Không thích">
              <LucideThumbsDown size={14} className="mr-1" /> {comment.dislikeComment || 0}
            </button>
            {level < 2 && currentUser && !isCurrentlyEditingThisItem && (
              <button onClick={() => onStartReply(comment.idComment)} className="hover:text-gray-200 flex items-center" title="Trả lời">
                <LucideReply size={14} className="mr-1" /> Trả lời
              </button>
            )}
            {comment.timeComment && <span className="text-gray-500 text-xs">{formatCommentDate(comment.timeComment)}</span>}
          </div>

          {isCurrentlyReplyingToThisItem && (
            <form onSubmit={(e) => onGlobalSubmitReply(e, comment.idComment)} className="mt-3 ml-0 md:ml-7">
              <textarea
                className="w-full p-2 text-sm bg-gray-600 text-gray-100 border border-gray-500 rounded-md focus:ring-1 focus:ring-sky-500"
                rows="2"
                placeholder={`Trả lời ${comment.userName}...`}
                value={globalReplyContent}
                onChange={onGlobalReplyContentChange}
                required
                disabled={isGlobalSubmittingReply}
                autoFocus
              />
              <div className="mt-1 flex items-center space-x-2">
                <button type="submit" disabled={isGlobalSubmittingReply || !globalReplyContent.trim()} className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-md disabled:opacity-60 flex items-center">
                  {isGlobalSubmittingReply && <LucideSpinner size={12} className="animate-spin mr-1" />} Gửi
                </button>
                <button type="button" onClick={onGlobalCancelReply} disabled={isGlobalSubmittingReply} className="px-2.5 py-1 bg-gray-500 hover:bg-gray-600 text-white text-xs font-semibold rounded-md">
                  Hủy
                </button>
              </div>
            </form>
          )}

          {comment.replyComments && comment.replyComments.length > 0 && (
            <div className="mt-3 space-y-3">
              {comment.replyComments.map(reply => (
                <CommentItem
                  key={reply.idComment}
                  comment={reply}
                  currentUser={currentUser}
                  chapterId={chapterId}
                  novelId={novelId}
                  onLike={onLike}
                  onDislike={onDislike}
                  onDelete={onDelete}
                  onStartEdit={onStartEdit}
                  onStartReply={onStartReply}
                  // Truyền các state và handler từ ChapterComments (global) xuống
                  globalEditingComment={globalEditingComment}
                  globalEditedContent={globalEditedContent}
                  onGlobalEditedContentChange={onGlobalEditedContentChange}
                  onGlobalUpdateComment={onGlobalUpdateComment}
                  onGlobalCancelEdit={onGlobalCancelEdit}
                  isGlobalUpdatingComment={isGlobalUpdatingComment}
                  globalReplyingToCommentId={globalReplyingToCommentId}
                  globalReplyContent={globalReplyContent}
                  onGlobalReplyContentChange={onGlobalReplyContentChange}
                  onGlobalSubmitReply={onGlobalSubmitReply}
                  onGlobalCancelReply={onGlobalCancelReply}
                  isGlobalSubmittingReply={isGlobalSubmittingReply}
                  openDropdownId={openDropdownId}
                  onToggleDropdown={onToggleDropdown}
                  assignDropdownRef={assignDropdownRef}
                  level={level + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


const ChapterComments = ({ chapterId, novelId }) => {
  const dispatch = useDispatch();
  const { commentsByChapter, loading, error, actionLoading = {} } = useSelector((state) => state.comments); // Thêm default cho actionLoading
  const currentUser = useSelector((state) => state.user.currentUser);

  const [newComment, setNewComment] = useState('');
  const [isSubmittingNewComment, setIsSubmittingNewComment] = useState(false);

  const [openDropdownId, setOpenDropdownId] = useState(null); // ID của comment có dropdown đang mở
  const [editingComment, setEditingComment] = useState(null); // Object comment đang được SỬA (quản lý ở đây)
  const [editedContent, setEditedContent] = useState('');    // Nội dung text của comment đang được SỬA
  const [isUpdatingComment, setIsUpdatingComment] = useState(false); // Trạng thái loading khi UPDATE comment

  const [replyingToCommentId, setReplyingToCommentId] = useState(null); // ID của comment đang được TRẢ LỜI
  const [replyContent, setReplyContent] = useState('');               // Nội dung của TRẢ LỜI đang nhập
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);    // Trạng thái loading khi GỬI reply

  const dropdownRefs = useRef({});

  useEffect(() => {
    if (chapterId) {
      dispatch(getCommentsByChapter(chapterId));
    }
    return () => { dispatch(clearComments()); };
  }, [dispatch, chapterId]);

  useEffect(() => {
    // Đồng bộ state loading cục bộ với actionLoading từ Redux
    setIsSubmittingNewComment(actionLoading?.create || false);
    setIsUpdatingComment(actionLoading?.update || false);
    // isSubmittingReply được quản lý riêng khi nhấn nút gửi reply
  }, [actionLoading]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdownId) {
        const currentDropdownRef = dropdownRefs.current[openDropdownId];
        if (currentDropdownRef && !currentDropdownRef.contains(event.target)) {
          setOpenDropdownId(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => { document.removeEventListener("mousedown", handleClickOutside); };
  }, [openDropdownId]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser?.idUser || !chapterId) return;
    setIsSubmittingNewComment(true); // Set loading cục bộ
    dispatch(clearCommentError());
    try {
      await dispatch(createComment({
        contentComment: newComment,
        idUser: currentUser.idUser,
        idChapter: chapterId,
      })).unwrap();
      setNewComment('');
    } catch (err) { console.error("Lỗi khi gửi bình luận:", err); }
    finally { setIsSubmittingNewComment(false); } // Reset loading cục bộ
  };

  const handleDeleteComment = async (commentId) => {
    const findCommentRecursive = (comments, id) => {
      for (const c of comments) {
        if (c.idComment === id) return c;
        if (c.replyComments && c.replyComments.length > 0) {
          const foundInReply = findCommentRecursive(c.replyComments, id);
          if (foundInReply) return foundInReply;
        }
      }
      return null;
    };
    const commentToDelete = findCommentRecursive(commentsByChapter || [], commentId);

    if (!commentToDelete) return;

    const isOwner = currentUser && commentToDelete.user && currentUser.idUser === commentToDelete.user.idUser;
    const isOwnerFallback = !commentToDelete.user && currentUser && currentUser.userNameUser === commentToDelete.userName;
    if (!isOwner && !isOwnerFallback /* && currentUser.role !== 'ADMIN' */) {
        alert("Bạn không có quyền xóa bình luận này.");
        setOpenDropdownId(null);
        return;
    }
    if (window.confirm("Bạn có chắc muốn xóa bình luận này không?")) {
      try {
        await dispatch(deleteComment(commentId)).unwrap();
        setOpenDropdownId(null);
      } catch (err) { console.error("Lỗi khi xóa bình luận:", err); }
    }
  };

   const handleLike = async (comment) => {
    if (!currentUser) {
      alert("Vui lòng đăng nhập để thích bình luận.");
      return;
    }
    // Payload cần idComment, idChapter, và idUser của người thực hiện
    const payload = {
      idComment: comment.idComment,
      idChapter: chapterId, // chapterId đã có sẵn từ props của ChapterComments
      idUser: currentUser.idUser,
    };
    try {
      // Dispatch action `likeComment`
      await dispatch(likeComment(payload)).unwrap();
    } catch (err) {
      console.error("Lỗi khi thích bình luận:", err);
      // Bạn có thể hiển thị thông báo lỗi cho người dùng ở đây nếu muốn
      // alert(err.message || 'Có lỗi xảy ra');
    }
  };

  // Hàm xử lý khi người dùng nhấn nút "Không thích"
  const handleDislike = async (comment) => {
    if (!currentUser) {
      alert("Vui lòng đăng nhập để bày tỏ cảm xúc.");
      return;
    }
    const payload = {
      idComment: comment.idComment,
      idChapter: chapterId,
      idUser: currentUser.idUser,
    };
    try {
      // Dispatch action `dislikeComment`
      await dispatch(dislikeComment(payload)).unwrap();
    } catch (err) {
      console.error("Lỗi khi không thích bình luận:", err);
    }
  };
  const handleStartEdit = (commentToEdit) => {
    const isOwner = currentUser && commentToEdit.user && currentUser.idUser === commentToEdit.user.idUser;
    const isOwnerFallback = !commentToEdit.user && currentUser && currentUser.userNameUser === commentToEdit.userName;
    if (!isOwner && !isOwnerFallback /* && currentUser.role !== 'ADMIN' */) {
        alert("Bạn không có quyền sửa bình luận này.");
        setOpenDropdownId(null); return;
    }
    setEditingComment(commentToEdit);
    setEditedContent(commentToEdit.contentComment);
    setOpenDropdownId(null);
    setReplyingToCommentId(null);
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditedContent('');
  };

  const handleUpdateComment = async (e) => {
    e.preventDefault();
    if (!editedContent.trim() || !editingComment || !currentUser?.idUser) return;
    setIsUpdatingComment(true);
    try {
      await dispatch(updateCommentContent({
        existingComment: editingComment,
        newContent: editedContent,
        idUserPerformingUpdate: currentUser.idUser,
        idChapterOfComment: chapterId
      })).unwrap();
      handleCancelEdit();
    } catch (err) { console.error("Lỗi khi cập nhật bình luận:", err); }
    finally { setIsUpdatingComment(false); }
  };

  const assignDropdownRef = (el, commentId) => { if (el) dropdownRefs.current[commentId] = el; };

  const handleStartReply = (commentId) => {
    setReplyingToCommentId(commentId);
    setReplyContent('');
    setOpenDropdownId(null);
    setEditingComment(null);
  };

  const handleCancelReply = () => {
    setReplyingToCommentId(null);
    setReplyContent('');
  };

  const handleSubmitReply = async (e, parentIdComment) => {
    e.preventDefault();
      console.log("Submitting reply:", { replyContent, currentUser, chapterId, parentIdComment });

    if (!replyContent.trim() || !currentUser?.idUser || !chapterId || !parentIdComment) return;
    setIsSubmittingReply(true);
    dispatch(clearCommentError());
    try {
      await dispatch(createComment({
        contentComment: replyContent,
        idUser: currentUser.idUser,
        idChapter: chapterId,
        idParent: parentIdComment // <<<< TRUYỀN ĐÚNG TÊN TRƯỜNG MÀ THUNK MONG ĐỢI
      })).unwrap();
      setReplyContent('');
      setReplyingToCommentId(null);
    } catch (err) { console.error("Lỗi khi gửi trả lời:", err); }
    finally { setIsSubmittingReply(false); }
  };

  const toggleDropdown = (commentId) => {
    setOpenDropdownId(openDropdownId === commentId ? null : commentId);
  };

  return (
    <div className="mt-8 bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold text-sky-400 mb-4 border-b border-gray-700 pb-2">
        Bình luận ({commentsByChapter?.reduce((acc, comment) => acc + 1 + (comment.replyComments?.length || 0), 0) || 0})
      </h3>

      {currentUser ? (
        <form onSubmit={handleSubmitComment} className="mb-6">
          <textarea
            className="w-full p-3 bg-gray-700 text-gray-200 border border-gray-600 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder-gray-500 resize-none"
            rows="3"
            placeholder="Viết bình luận của bạn..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            required
            disabled={isSubmittingNewComment}
          />
          {error && typeof error === 'string' && <p className="text-red-500 text-xs mt-1">{error}</p>}
          <button
            type="submit"
            disabled={isSubmittingNewComment || !newComment.trim()}
            className="mt-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center"
          >
            {isSubmittingNewComment ? <LucideSpinner size={18} className="animate-spin mr-2" /> : <LucideSend size={16} className="mr-2" />}
            Gửi bình luận
          </button>
        </form>
      ) : (
         <p className="mb-6 text-gray-400 text-sm">Vui lòng <Link to="/login" className="text-sky-400 hover:underline">đăng nhập</Link> để bình luận.</p>
      )}

      {loading && (!commentsByChapter || commentsByChapter.length === 0) && (
         <div className="text-center text-gray-400 py-4">
          <LucideSpinner size={24} className="animate-spin inline mr-2" /> Đang tải bình luận...
        </div>
      )}
      {!loading && commentsByChapter && commentsByChapter.length === 0 && !error && (
         <p className="text-gray-500 text-center py-4">Chưa có bình luận nào cho chương này.</p>
      )}
      {error && typeof error === 'string' && (!commentsByChapter || commentsByChapter.length === 0) && (
          <p className="text-red-500 text-center py-4">{error}</p>
      )}


      <div className="space-y-4">
        {commentsByChapter && commentsByChapter.map((comment) => (
          <CommentItem
            key={comment.idComment}
            comment={comment}
            currentUser={currentUser}
            chapterId={chapterId}
            novelId={novelId} // Truyền novelId xuống
            onLike={handleLike}
            onDislike={handleDislike}
            onDelete={handleDeleteComment}
            onStartEdit={handleStartEdit}
            onStartReply={handleStartReply}
            // Props cho việc sửa (quản lý bởi ChapterComments)
            globalEditingComment={editingComment}
            globalEditedContent={editedContent}
            onGlobalEditedContentChange={(e) => setEditedContent(e.target.value)}
            onGlobalUpdateComment={handleUpdateComment}
            onGlobalCancelEdit={handleCancelEdit}
            isGlobalUpdatingComment={isUpdatingComment}
            // Props cho việc reply (quản lý bởi ChapterComments)
            globalReplyingToCommentId={replyingToCommentId}
            globalReplyContent={replyContent}
            onGlobalReplyContentChange={(e) => setReplyContent(e.target.value)}
            onGlobalSubmitReply={handleSubmitReply}
            onGlobalCancelReply={handleCancelReply}
            isGlobalSubmittingReply={isSubmittingReply}
            // Props chung
            openDropdownId={openDropdownId}
            onToggleDropdown={toggleDropdown}
            assignDropdownRef={assignDropdownRef}
            level={0}
          />
        ))}
      </div>
    </div>
  );
};

export default ChapterComments;