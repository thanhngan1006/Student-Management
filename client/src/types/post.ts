import { CommentType } from "./comment";

export interface PostType {
  _id: string;
  author_id: string;
  author_name: string;
  class_id: string;
  content: string;
  liked_by: string[];
  comments: CommentType[];
  created_at: string;
}
