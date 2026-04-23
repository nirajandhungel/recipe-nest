import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { commentSchema } from '../../utils/validators';
import { socialApi } from '../../api/socialApi';
import { useAuth } from '../../context/AuthContext';
import { timeAgo, getInitials, getUserProfileImage } from '../../utils/helpers';
import Button from '../ui/Button';
import { Trash2, MessageCircle, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

const CommentSection = ({ recipeId, onRatingChange }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const navigate = useNavigate();

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
    if (!user) {
      toast.error('Please log in to comment');
      navigate('/auth/login');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await socialApi.addComment(recipeId, content, selectedRating || undefined);
      const newComment = data.data?.comment || data.comment || {
        content,
        text: content,
        rating: selectedRating || undefined,
        createdAt: new Date(),
        userId: user,
      };
      setComments((prev) => [newComment, ...prev]);
      if (data?.data?.recipeRating && onRatingChange) {
        onRatingChange(data.data.recipeRating);
      }
      reset();
      setSelectedRating(0);
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
          {getUserProfileImage(user) ? (
            <img src={getUserProfileImage(user)} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
              {getInitials(user.firstName, user.lastName)}
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectedRating(value)}
                  className="text-surface-300 hover:text-yellow-500 transition-colors"
                  aria-label={`Rate ${value} star${value > 1 ? 's' : ''}`}
                >
                  <Star className={`w-4 h-4 ${value <= selectedRating ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="input-base flex-1"
                placeholder="Add a comment..."
                {...register('content')}
              />
              <Button type="submit" loading={submitting}>Post</Button>
            </div>
          </div>
        </form>
      ) : (
        <p className="text-sm text-surface-500 italic">
          <Link to="/auth/login" className="text-brand-600 hover:underline">Log in</Link> to comment, like, save, and rate.
        </p>
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
            const authorImage = getUserProfileImage(author);
            const authorId = author?._id;
            return (
              <div key={comment._id} className="flex gap-3">
                <Link to={authorId ? `/profile/${authorId}` : '#'} className={!authorId ? 'pointer-events-none' : ''}>
                  {authorImage ? (
                    <img src={authorImage} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-surface-200 text-surface-600 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                      {getInitials(author?.firstName || 'U', author?.lastName || '')}
                    </div>
                  )}
                </Link>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <Link to={authorId ? `/profile/${authorId}` : '#'} className={`text-sm font-medium hover:text-brand-600 ${!authorId ? 'pointer-events-none' : ''}`}>
                      {author?.firstName} {author?.lastName}
                    </Link>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-surface-400">{timeAgo(comment.createdAt)}</span>
                      {canDelete && (
                        <button onClick={() => handleDelete(comment._id)} className="text-red-400 hover:text-red-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  {comment.rating ? (
                    <div className="flex items-center gap-0.5 mt-1 text-yellow-500">
                      {[...Array(5)].map((_, idx) => (
                        <Star key={idx} className={`w-3.5 h-3.5 ${idx < comment.rating ? 'fill-current' : 'opacity-30'}`} />
                      ))}
                    </div>
                  ) : null}
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
