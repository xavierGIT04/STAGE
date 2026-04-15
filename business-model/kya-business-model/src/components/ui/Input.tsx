interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    hint?: string
}

export default function Input({
                                  label,
                                  error,
                                  hint,
                                  className = '',
                                  ...props
                              }: InputProps) {
    return (
        <div className="flex flex-col gap-1.5">
            {label && (
                <label className="text-sm font-medium text-gray-700">
                    {label}
                    {props.required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <input
                className={`
          w-full px-3 py-2.5 text-sm
          border border-gray-200 rounded-xl
          bg-white text-gray-900
          placeholder:text-gray-400
          focus:outline-none focus:border-gray-400
          transition-colors duration-150
          disabled:bg-gray-50 disabled:text-gray-400
          ${error ? 'border-red-300 focus:border-red-400' : ''}
          ${className}
        `}
                {...props}
            />
            {hint && !error && (
                <p className="text-xs text-gray-400">{hint}</p>
            )}
            {error && (
                <p className="text-xs text-red-500">{error}</p>
            )}
        </div>
    )
}