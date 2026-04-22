import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { commentSchema } from '../../utils/validators';
import { socialApi } from '../../api/socialApi';
import { useAuth } from '../../context/AuthContext';
import { timeAgo, getInitials } from '../../utils/helpers';
import Button from '../ui/Button';
import { Trash2, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const CommentSection = ({ recipeId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(commentSchema),
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await socialApi.getComments(recipeId);
        const list = Array.isArray(data.data) ? data.data : (data.data?.comments || data.comments || []);
        setComments(list);
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [recipeId]);

  const onSubmit = async ({ content }) => {
    setSubmitting(true);
    try {
      const { data } = await socialApi.addComment(recipeId, content);
      const newComment = data.data?.comment || data.comment || { content, text: content, createdAt: new Date(), userId: user };
      setComments((prev) => [newComment, ...prev]);
      reset();
      toast.success('Comment added!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await socialApi.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      toast.success('Comment deleted');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete comment');
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-display font-semibold text-lg flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-brand-500" />
        Comments ({comments.length})
      </h3>

      {/* Comment form */}
      {user ? (
        <form onSubmit={handleSubmit(onSubmit)} className="flex gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
            {getInitials(user.firstName, user.lastName)}
          </div>
          <div className="flex-1 flex gap-2">
            <input
              className="input-base flex-1"
              placeholder="Add a comment..."
              {...register('content')}
            />
            <Button type="submit" loading={submitting}>Post</Button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-surface-500 italic">Log in to comment.</p>
      )}
      {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}

      {/* Comments list */}
      {loading ? (
        <p className="text-sm text-surface-400">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-surface-400">No comments yet. Be the first!</p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => {
            const author = comment.userId || comment.author;
            const canDelete = user && (user._id === author?._id || user.role === 'admin');
            return (
              <div key={comment._id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-200 text-surface-600 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                  {getInitials(author?.firstName || 'U', author?.lastName || '')}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">
                      {author?.firstName} {author?.lastName}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-surface-400">{timeAgo(comment.createdAt)}</span>
                      {canDelete && (
                        <button onClick={() => handleDelete(comment._id)} className="text-red-400 hover:text-red-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-surface-600 dark:text-surface-300 mt-0.5">{comment.content || comment.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
