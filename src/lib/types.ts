export type AppStatus = 'active'|'development'|'beta'|'paused'|'archived'|'offline';
export type Visibility = 'public'|'private';

export interface Category { id:number; name:string; slug:string; description:string; icon:string; sort_order:number; is_active:number; app_count?:number; created_at:string; updated_at:string; }
export interface Tag { id:number; name:string; slug:string; created_at:string; }
export interface Screenshot { id:number; app_id:number; r2_key:string; alt_text:string; sort_order:number; created_at:string; }
export interface AppRecord {
  id:number; name:string; slug:string; production_url:string; admin_url?:string; github_repo?:string; cloudflare_project?:string;
  icon_key:string; cover_key:string; short_description:string; description:string; primary_use:string; audience:string; features:string;
  category_id:number|null; category_name?:string; category_slug?:string; tag_names?:string; status:AppStatus; visibility:Visibility; featured:number;
  pricing_type:string; platform:string; tech_stack:string; version:string; search_keywords:string; github_repo_full_name:string; github_default_branch:string; github_last_commit_sha:string; github_last_commit_message:string; github_last_commit_at:string; github_last_synced_at:string; github_sync_error:string; monitor_enabled:number; last_checked_at:string; last_http_status:number|null; last_response_ms:number|null; last_error:string; created_at:string; updated_at:string;
  total_opens?:number; total_views?:number; tags?:Tag[]; screenshots?:Screenshot[];
}
