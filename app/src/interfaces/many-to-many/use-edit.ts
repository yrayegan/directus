import { Ref, ref } from '@vue/composition-api';
import { RelationInfo } from './use-relation';
import { isEqual, get } from 'lodash';

export default function useEdit(
	value: Ref<(string | number | Record<string, any>)[] | null>,
	relation: Ref<RelationInfo>,
	emit: (newVal: any[] | null) => void
) {
	// Primary key of the item we're currently editing. If null, the edit modal should be
	// closed
	const currentlyEditing = ref<string | number | null>(null);
	const relatedPrimaryKey = ref<string | number | null>(null);

	// This keeps track of the starting values so we can match with it
	const editsAtStart = ref<Record<string, any>>({});

	function editItem(item: any) {
		const { relationPkField, junctionRelation, junctionPkField } = relation.value;

		editsAtStart.value = item;
		relatedPrimaryKey.value = get(item, [junctionRelation, relationPkField], null);
		currentlyEditing.value = get(item, [junctionPkField], null);
	}

	function stageEdits(edits: any) {
		const { relationPkField, junctionRelation, junctionPkField } = relation.value;

		const newValue = (value.value || []).map((item) => {
			if (currentlyEditing.value !== null) {
				const id = currentlyEditing.value;

				if (typeof item === 'object' && junctionPkField in item) {
					if (item[junctionPkField] === id) return edits;
				} else if (['number', 'string'].includes(typeof item)) {
					if (item === id) return edits;
				}
			}

			if (relatedPrimaryKey.value != null) {
				const id = relatedPrimaryKey.value;

				if (get(item, [junctionRelation], null) === id) return edits;
				if (get(item, [junctionRelation, relationPkField], null) === id) return edits;
			}

			if (isEqual(editsAtStart.value, item)) {
				return edits;
			}

			return item;
		});

		if (relatedPrimaryKey.value === null && currentlyEditing.value === null && newValue.includes(edits) === false) {
			newValue.push(edits);
		}

		if (newValue.length === 0) emit(null);
		else emit(newValue);
	}

	function cancelEdit() {
		editsAtStart.value = {};
		currentlyEditing.value = null;
		relatedPrimaryKey.value = null;
	}

	return { currentlyEditing, editItem, editsAtStart, stageEdits, cancelEdit, relatedPrimaryKey };
}
