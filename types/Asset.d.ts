interface AssetMonoBehaviour<T extends Object = {}> {
	MonoBehaviour: Asset & T;
}

interface Asset {
	m_ObjectHideFlags:           number;
	m_CorrespondingSourceObject: AssetSource;
	m_PrefabInstance:            AssetSource;
	m_PrefabAsset:               AssetSource;
	m_GameObject:                AssetSource;
	m_Enabled:                   number;
	m_EditorHideFlags:           number;
	m_Script:                    AssetSource;
	m_Name:                      string;
	m_EditorClassIdentifier?:    string;
	serializationData?:          SerializationData;
	_assetId?:                   string;
	_typeName?:                  string;
}

interface SerializationData {
	SerializedFormat:                          number;
	SerializedBytes?:                          string;
	ReferencedUnityObjects?:                   AssetSource[];
	SerializedBytesString?:                    string;
	Prefab:                                    AssetSource;
	PrefabModificationsReferencedUnityObjects: any[];
	PrefabModifications:                       any[];
	SerializationNodes:                        any[];
}

interface AssetSource {
	fileID: number;
	guid?:  string;
	type?:  number;
}
