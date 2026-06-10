export interface user {
    id: number
    username: string
    email: string
    password_hash: string
    role: string
    created_at: string
}

export interface session{
    id: string
    user_id: number
    expires_at: string
}

export interface post {
    id: number
    user_id: number
    title: string
    content: string
    image_path: string | null
    created_at: string
}

export interface comment {
    id: number
    post_id: number
    user_id: number
    content: string
}

export interface category {
    id: number
    name: string
}

export interface reaction {
    id: number
    user_id: number | null
    post_id: number | null
    comment_id: number | null
    type: string
}