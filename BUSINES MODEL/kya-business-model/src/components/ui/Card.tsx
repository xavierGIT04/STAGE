interface CardProps {
    children: React.ReactNode
    className?: string
    padding?: 'sm' | 'md' | 'lg'
    onClick?: () => void
    hover?: boolean
}

export default function Card({
                                 children,
                                 className = '',
                                 padding = 'md',
                                 onClick,
                                 hover = false,
                             }: CardProps) {

    const paddings = {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    }

    return (
        <div
            onClick={onClick}
            className={`
        bg-white border border-gray-200 rounded-2xl
        ${paddings[padding]}
        ${hover ? 'cursor-pointer transition-shadow duration-150 hover:shadow-md' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
        >
            {children}
        </div>
    )
}