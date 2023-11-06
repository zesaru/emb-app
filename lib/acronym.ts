/**
 * Returns the initials of each word in the input string.
 * 
 * @param inputString - The input string from which to extract the initials.
 * @returns A string containing the initials of each word in the input string.
 * 
 * @example
 * const inputString = "John Doe";
 * const initials = getInitials(inputString);
 * console.log(initials); // Output: "JD"
 */
export function getInitials(inputString: string): string {

    if (!inputString) {
        return '';
    }
    const words = inputString.split(' ');
    const initials = words.map((word) => word.charAt(0)); 
    return initials.join(''); 
}