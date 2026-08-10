import { URI } from '../../../../base/common/uri.js';

export type CodeDirectoryItem = {
	uri: URI;
	name: string;
	isSymbolicLink: boolean;
	children: CodeDirectoryItem[] | null;
	isDirectory: boolean;
	isGitIgnoredDirectory: false | { numChildren: number }; // if directory is gitignored, we ignore children
}
